// app/(Main)/Profile.tsx
import type { UploadableProfileImage } from "@/src/api";
import { getProfile, updateProfile } from "@/src/api";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const Profile = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(""); // remote URL from backend
  const [localImageUri, setLocalImageUri] = useState(""); // local URI for display after picking
  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [businessType, setBusinessType] = useState("");

  // Holds the picked image asset until Save is pressed
  const pendingImageRef = useRef<UploadableProfileImage | null>(null);

  // Fetch user data when screen loads
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const userData = await getProfile();
        setBusinessName(userData.name || userData.business_name || "");
        setPhoneNumber(userData.phone || "");
        setBusinessType(userData.business_type || "");
        setProfileImage(userData.profile_image || "");
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Could not fetch profile data.");
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  // Convert ImagePickerAsset → UploadableProfileImage
  const asUploadable = (
    asset: ImagePicker.ImagePickerAsset,
  ): UploadableProfileImage => ({
    uri: asset.uri,
    fileName: asset.fileName ?? asset.uri.split("/").pop(),
    mimeType: asset.mimeType ?? "image/jpeg",
    type: asset.mimeType ?? "image/jpeg",
  });

  // Handle picking image — just store it locally, do NOT upload yet
  const handlePickImage = async (useCamera: boolean) => {
    if (Platform.OS === "web" && !useCamera) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        pendingImageRef.current = asUploadable(asset);
        setLocalImageUri(asset.uri); // show immediately in UI
      }
      return;
    }

    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Denied",
        "Permission to access camera or gallery is required!",
      );
      return;
    }

    const pickerOptions = {
      mediaTypes: "images" as const,
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
      quality: 0.7,
    };

    const result = useCamera
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions);

    if (!result.canceled) {
      const asset = result.assets[0];
      pendingImageRef.current = asUploadable(asset);
      setLocalImageUri(asset.uri); // show immediately in UI
    }
  };

  // Save everything in one request — text fields + image together
  const handleSave = async () => {
    if (!businessName.trim()) {
      Alert.alert("Required", "Please enter your business name");
      return;
    }

    setLoading(true);
    try {
      const updated = await updateProfile(
        {
          name: businessName,
          business_name: businessName,
          business_type: businessType || undefined,
          // NEVER add profile_image here as a string
        },
        // If user picked a new image, send it. Otherwise undefined = no change.
        pendingImageRef.current ?? undefined,
      );

      // Update displayed image with what the backend confirms
      if (updated.profile_image) {
        setProfileImage(updated.profile_image);
        setLocalImageUri(""); // clear local URI, use remote now
      }

      pendingImageRef.current = null;
      Alert.alert("Success", "Profile details saved!");
      router.back();
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile details.");
    }
    setLoading(false);
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === "web") {
      handlePickImage(false);
      return;
    }
    Alert.alert(
      "Change Profile Picture",
      "How would you like to select a new photo?",
      [
        { text: "Take Photo", onPress: () => handlePickImage(true) },
        { text: "Choose from Gallery", onPress: () => handlePickImage(false) },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  // Display local URI if user just picked one, otherwise use remote URL
  const displayImage = localImageUri || profileImage;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        {/* Profile Picture */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={showImagePickerOptions}
            style={styles.profileImageContainer}
            disabled={loading}
          >
            <Image
              key={displayImage} // bust cache on URI change
              source={
                displayImage
                  ? { uri: displayImage }
                  : require("../../assets/images/noImg.jpg")
              }
              style={styles.profileImage}
            />
            <View style={styles.cameraIconContainer}>
              <Feather name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.imageTip}>
            {localImageUri
              ? "Image selected — tap Save to upload"
              : "Tap to change picture"}
          </Text>
        </View>

        {/* Business Name Input */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Business Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your business name"
            value={businessName}
            onChangeText={setBusinessName}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        {/* Phone Number (Read-only) */}
        {phoneNumber && (
          <View style={styles.formSection}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={phoneNumber}
              editable={false}
            />
            <Text style={styles.helpText}>Phone number cannot be changed</Text>
          </View>
        )}

        {/* Business Type (Read-only) */}
        {businessType && (
          <View style={styles.formSection}>
            <Text style={styles.label}>Business Type</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={
                businessType === "retail" ? "Retail Shop" : "Service Business"
              }
              editable={false}
            />
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#F4F7FC",
    marginBottom: 20,
  },
  backButton: { marginRight: 10, padding: 5 },
  headerTitle: {
    fontSize: 20,
    color: "#111827",
    fontFamily: "DMSans_700Bold",
  },
  profileSection: { alignItems: "center", marginBottom: 30 },
  profileImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: { width: 150, height: 150, borderRadius: 75 },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#1155CC",
    padding: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#F4F7FC",
  },
  imageTip: {
    marginTop: 10,
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "DMSans_400Regular",
  },
  formSection: { paddingHorizontal: 20, marginBottom: 20 },
  label: {
    fontSize: 16,
    color: "#111827",
    marginBottom: 8,
    fontFamily: "DMSans_700Bold",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontFamily: "DMSans_400Regular",
  },
  readOnlyInput: {
    backgroundColor: "#F9FAFB",
    color: "#6B7280",
  },
  helpText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontFamily: "DMSans_400Regular",
  },
  saveButton: {
    backgroundColor: "#1155CC",
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontFamily: "DMSans_700Bold",
  },
  disabled: {
    opacity: 0.6,
  },
});

export default Profile;
