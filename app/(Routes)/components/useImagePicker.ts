import { Alert, PermissionsAndroid, Platform } from "react-native";
import {
  Asset,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
  MediaType,
} from "react-native-image-picker";

export interface PickedImage {
  uri: string;
  type?: string;
  fileName?: string;
}

export function useImagePicker(onImagePicked: (image: PickedImage) => void) {
  const pickImage = async (useCamera: boolean) => {
    if (useCamera && Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "The app needs camera access to take pictures.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          "Permission Denied",
          "You need to grant camera permission to use this feature.",
        );
        return;
      }
    }

    const options = { mediaType: "photo" as MediaType, includeBase64: false };

    try {
      let response: ImagePickerResponse;
      if (useCamera) {
        response = await launchCamera(options);
      } else {
        response = await launchImageLibrary(options);
      }

      if (response.didCancel) return;

      if (response.errorCode) {
        Alert.alert(
          "Error",
          response.errorMessage || "An unknown error occurred.",
        );
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset: Asset = response.assets[0];
        if (asset.uri) {
          onImagePicked({
            uri: asset.uri,
            type: asset.type,
            fileName: asset.fileName,
          });
        }
      }
    } catch (error) {
      console.log("Caught an unexpected error:", error);
      Alert.alert(
        "Unexpected Error",
        "An unexpected error occurred while picking an image.",
      );
    }
  };

  return { pickImage };
}
