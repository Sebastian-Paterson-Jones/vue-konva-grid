import { ref, watch, onUnmounted } from "vue";

export interface UseImageProps {
  url: string;
  crossOrigin?: string;
}

export interface UseImageResults {
  image?: HTMLImageElement;
  width: number;
  height: number;
  status: string;
}

export const useImage = ({ url, crossOrigin }: UseImageProps) => {
  const image = ref<HTMLImageElement | undefined>();
  const width = ref(0);
  const height = ref(0);
  const status = ref("loading");

  let img: HTMLImageElement | null = null;

  const onload = () => {
    if (img) {
      image.value = img;
      height.value = img.height;
      width.value = img.width;
      status.value = "loaded";
    }
  };

  const onerror = () => {
    image.value = undefined;
    status.value = "failed";
  };

  watch(
    () => [url, crossOrigin],
    ([newUrl, newCrossOrigin], [oldUrl, oldCrossOrigin], onCleanup) => {
      if (!newUrl) {
        status.value = "idle";
        image.value = undefined;
        width.value = 0;
        height.value = 0;
        return;
      }

      if (img) {
        img.removeEventListener("load", onload);
        img.removeEventListener("error", onerror);
      }

      img = new Image();
      status.value = "loading";
      image.value = undefined;
      width.value = 0;
      height.value = 0;

      img.addEventListener("load", onload);
      img.addEventListener("error", onerror);

      if (newCrossOrigin) {
        img.crossOrigin = newCrossOrigin;
      }
      img.src = newUrl;

      onCleanup(() => {
        if (img) {
          img.removeEventListener("load", onload);
          img.removeEventListener("error", onerror);
        }
      });
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (img) {
      img.removeEventListener("load", onload);
      img.removeEventListener("error", onerror);
    }
  });

  return { image, width, height, status };
};
