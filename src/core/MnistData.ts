import * as tf from '@tensorflow/tfjs';

const MNIST_IMAGES_SPRITE_PATH =
    'https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png';
const MNIST_LABELS_PATH =
    'https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8';

const IMAGE_SIZE = 784;
const NUM_CLASSES = 10;
const NUM_DATASET_ELEMENTS = 65000;

const NUM_TRAIN_ELEMENTS = 55000;
const NUM_TEST_ELEMENTS = NUM_DATASET_ELEMENTS - NUM_TRAIN_ELEMENTS;

const MNIST_IMAGES_SPRITE_PATH_LOCAL = '/mnist_images.png';
const MNIST_LABELS_PATH_LOCAL = '/mnist_labels_uint8';

export class MnistData {
    datasetImages: Float32Array | null = null;
    datasetLabels: Uint8Array | null = null;
    trainImages: Float32Array | null = null;
    testImages: Float32Array | null = null;
    trainLabels: Uint8Array | null = null;
    testLabels: Uint8Array | null = null;

    async load() {
        // Make a request for the MNIST sprited image.
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const imgRequest = new Promise((resolve) => {
            // Use local properties or fallback to remote
            img.crossOrigin = '';
            img.onload = () => {
                img.width = img.naturalWidth;
                img.height = img.naturalHeight;

                const datasetBytesBuffer =
                    new ArrayBuffer(NUM_DATASET_ELEMENTS * IMAGE_SIZE * 4);

                const chunkSize = 5000;
                canvas.width = img.width;
                canvas.height = chunkSize;

                for (let i = 0; i < NUM_DATASET_ELEMENTS / chunkSize; i++) {
                    const datasetBytesView = new Float32Array(
                        datasetBytesBuffer, i * IMAGE_SIZE * chunkSize * 4,
                        IMAGE_SIZE * chunkSize);
                    ctx!.drawImage(
                        img, 0, i * chunkSize, img.width, chunkSize, 0, 0, img.width,
                        chunkSize);

                    const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);

                    for (let j = 0; j < imageData.data.length / 4; j++) {
                        // All channels hold an equal value since the image is grayscale, so
                        // just read the red channel.
                        datasetBytesView[j] = imageData.data[j * 4] / 255;
                    }
                }
                this.datasetImages = new Float32Array(datasetBytesBuffer);
                console.log(`DEBUG: MNIST Images Loaded. Total Elements: ${this.datasetImages.length}`);
                console.log(`DEBUG: Sprite Dimensions: ${img.width}x${img.height}`);

                // Check for Empty Data (CORS/Loading error often results in all zeros)
                let sum = 0;
                for (let i = 0; i < 1000; i++) sum += this.datasetImages[i];
                console.log(`DEBUG: Sum of first 1000 pixels: ${sum} (If 0, images failed to load)`);

                resolve(true);
            };

            img.onerror = (err) => {
                console.error("MNIST Image Load Failed:", err);
            }

            img.src = MNIST_IMAGES_SPRITE_PATH;
        });

        const labelsRequest = fetch(MNIST_LABELS_PATH);
        const [imgResponse, labelsResponse] =
            await Promise.all([imgRequest, labelsRequest]);

        this.datasetLabels = new Uint8Array(await (labelsResponse as Response).arrayBuffer());

        console.log(`DEBUG: Raw Labels Size: ${this.datasetLabels.length}`);

        // Check if labels are one-hot (10 bytes per label) or scalar (1 byte)
        // 65,000 items. One-hot = 650,000 bytes. Scalar = 65,000 bytes.
        let isOneHot = false;
        if (this.datasetLabels.length >= NUM_DATASET_ELEMENTS * NUM_CLASSES) {
            isOneHot = true;
            console.log("DEBUG: Labels detected as One-Hot Encoded (10 bytes/label).");
        } else {
            console.log("DEBUG: Labels detected as Scalar (1 byte/label).");
        }

        // Create shuffled indices into the train/test set
        this.trainImages =
            this.datasetImages!.slice(0, IMAGE_SIZE * NUM_TRAIN_ELEMENTS);
        this.testImages = this.datasetImages!.slice(IMAGE_SIZE * NUM_TRAIN_ELEMENTS);

        if (isOneHot) {
            this.trainLabels = this.datasetLabels!.slice(0, NUM_CLASSES * NUM_TRAIN_ELEMENTS);
            this.testLabels = this.datasetLabels!.slice(NUM_CLASSES * NUM_TRAIN_ELEMENTS);
        } else {
            // Robust Header Detection (only for scalar labels, as one-hot files usually don't have headers)
            // Standard MNIST labels file is 60008 bytes (8 byte header + 60000 labels) or 65008
            // Google's file might be 65000 exactly.
            // If length > NUM_DATASET_ELEMENTS, usually means header is present.
            if (this.datasetLabels.length > NUM_DATASET_ELEMENTS) {
                const diff = this.datasetLabels.length - NUM_DATASET_ELEMENTS;
                console.log(`DEBUG: Detected Header of size ${diff} bytes. Skipping.`);
                this.datasetLabels = this.datasetLabels.slice(diff);
            } else {
                console.log("DEBUG: No Header detected (Exact size match).");
            }
            this.trainLabels = this.datasetLabels!.slice(0, NUM_TRAIN_ELEMENTS);
            this.testLabels = this.datasetLabels!.slice(NUM_TRAIN_ELEMENTS);
        }

        console.log("MNIST Labels Loaded. Length:", this.datasetLabels.length);
        console.log("First 10 Labels:", this.datasetLabels.slice(0, 10));

        this.trainIndices = tf.util.createShuffledIndices(NUM_TRAIN_ELEMENTS);
        this.testIndices = tf.util.createShuffledIndices(NUM_TEST_ELEMENTS);
    }

    nextTrainBatch(batchSize: number) {
        return this.nextBatch(
            batchSize, [this.trainImages!, this.trainLabels!], () => {
                this.shuffledTrainIndex =
                    (this.shuffledTrainIndex + 1) % this.trainIndices.length;
                return this.trainIndices[this.shuffledTrainIndex];
            });
    }

    nextTestBatch(batchSize: number) {
        return this.nextBatch(batchSize, [this.testImages!, this.testLabels!], () => {
            this.shuffledTestIndex =
                (this.shuffledTestIndex + 1) % this.testIndices.length;
            return this.testIndices[this.shuffledTestIndex];
        });
    }

    shuffledTrainIndex = 0;
    shuffledTestIndex = 0;
    trainIndices: Uint32Array = new Uint32Array(0);
    testIndices: Uint32Array = new Uint32Array(0);

    nextBatch(batchSize: number, data: [Float32Array, Uint8Array], index: Function) {
        const batchImagesArray = new Float32Array(batchSize * IMAGE_SIZE);
        const batchLabelsArray = new Uint8Array(batchSize * NUM_CLASSES);

        // Derived check: trainLabels length is NUM_CLASSES * 55000 if one-hot
        const stride = (data[1].length > NUM_TRAIN_ELEMENTS) ? NUM_CLASSES : 1;

        for (let i = 0; i < batchSize; i++) {
            const idx = index();

            const image =
                data[0].slice(idx * IMAGE_SIZE, idx * IMAGE_SIZE + IMAGE_SIZE);
            batchImagesArray.set(image, i * IMAGE_SIZE);

            if (stride === NUM_CLASSES) {
                // ALREADY ONE-HOT
                const label = data[1].slice(idx * NUM_CLASSES, idx * NUM_CLASSES + NUM_CLASSES);
                batchLabelsArray.set(label, i * NUM_CLASSES);
            } else {
                // MANUAL ENCODING
                const labelIndex = data[1][idx];
                const label = new Uint8Array(NUM_CLASSES).fill(0);
                label[labelIndex] = 1;
                batchLabelsArray.set(label, i * NUM_CLASSES);
            }
        }

        const xs = tf.tensor2d(batchImagesArray, [batchSize, IMAGE_SIZE]);
        const ys = tf.tensor2d(batchLabelsArray, [batchSize, NUM_CLASSES]);

        return { xs, ys };
    }
}

