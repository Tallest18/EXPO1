import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert } from "react-native";

export interface PickedImage {
  uri: string;
  type?: string;
  fileName?: string;
}

// Raw image handed off to the in-app cropper before it becomes a PickedImage.
export interface RawImage {
  uri: string;
  width: number;
  height: number;
  fileName?: string;
}

export function useImagePicker(onImagePicked: (image: PickedImage) => void) {
  // Image waiting to be cropped. When set, the caller should render the cropper.
  const [pendingImage, setPendingImage] = useState<RawImage | null>(null);

  const handleAsset = (asset: ImagePicker.ImagePickerAsset | undefined) => {
    if (!asset?.uri) return;
    setPendingImage({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName:
        asset.fileName ??
        asset.uri.split("/").pop() ??
        `product-${Date.now()}.jpg`,
    });
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) {
          Alert.alert(
            "Permission Denied",
            "You need to grant camera permission to take a picture.",
          );
          return;
        }
        // No allowsEditing: we crop in-app for a consistent experience.
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 1,
        });
        if (!result.canceled) handleAsset(result.assets?.[0]);
      } else {
        const { granted } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
          Alert.alert(
            "Permission Denied",
            "You need to grant photo library permission to select an image.",
          );
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 1,
        });
        if (!result.canceled) handleAsset(result.assets?.[0]);
      }
    } catch (error) {
      console.log("Caught an unexpected error:", error);
      Alert.alert(
        "Unexpected Error",
        "An unexpected error occurred while picking an image.",
      );
    }
  };

  // Called by the cropper once the user confirms the crop.
  const handleCropComplete = (image: PickedImage) => {
    onImagePicked(image);
    setPendingImage(null);
  };

  const handleCropCancel = () => setPendingImage(null);

  return { pickImage, pendingImage, handleCropComplete, handleCropCancel };
}
