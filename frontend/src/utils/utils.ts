import imageCompression from 'browser-image-compression';

export const sleep = async (t: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, t);
    });
};

export async function copy(content: string) {
    await navigator.clipboard.writeText(content);
}

export const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

export const downloadImage = async (src: string, name: string) => {
    try {
        const image = await fetch(src);
        const imageBlog = await image.blob();
        const imageURL = URL.createObjectURL(imageBlog);

        const link = document.createElement('a');
        link.href = imageURL;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.log(e);
    }
};

export const getBindMessage = (chainType: string) => {
    return `sign this message to bind ${chainType} account.\ncurrent time: ${Math.floor(
        new Date().valueOf() / 1000,
    )}`;
};

export const compressImage = async (
    imageFile: File,
    callback?: { onSuccess: VoidFunction; onFail: VoidFunction },
) => {
    const controller = new AbortController();
    return new Promise<File | boolean>((resolve) => {
        imageCompression(imageFile, {
            signal: controller.signal,
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            fileType: 'image/jpeg',
            useWebWorker: true,
        })
            .then((res) => {
                callback?.onSuccess();
                resolve(res);
            })
            .catch(() => {
                callback?.onFail();
                resolve(false);
            });
    });
};

export const isImageSupported = async (file: File) => {
    return new Promise<boolean>((resolve) => {
        const reader = new FileReader();
        reader.onload = function () {
            const url = reader.result as string;
            if (!url) resolve(false);
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
        };
        reader.readAsDataURL(file as Blob);
    });
};

export const isInProgress = (status: string) => {
    return status === 'CREATED' || status === 'STARTED';
};

export const getWalletSignInMessage = () => {
    return `sign this message to login AIVERSE.current time:${Math.floor(
        new Date().valueOf() / 1000,
    )}`;
};
