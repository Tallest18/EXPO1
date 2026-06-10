import { Ionicons } from "@expo/vector-icons";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PickedImage, RawImage } from "./useImagePicker";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_SIZE = 60; // minimum crop box size (display px)
const HANDLE = 28; // touch target for corner handles

interface Props {
  visible: boolean;
  image: RawImage | null;
  onDone: (image: PickedImage) => void;
  onCancel: () => void;
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const ImageCropper: React.FC<Props> = ({ visible, image, onDone, onCancel }) => {
  const insets = useSafeAreaInsets();
  const [processing, setProcessing] = useState(false);

  // The rectangle the image is fitted into (contain) within the stage.
  const fitRef = useRef<Rect>({ x: 0, y: 0, width: 0, height: 0 });
  const [crop, setCrop] = useState<Rect>({ x: 0, y: 0, width: 0, height: 0 });
  const cropRef = useRef<Rect>(crop);
  cropRef.current = crop;
  const startRef = useRef<Rect>(crop); // crop at gesture start

  // Compute the fitted image rect whenever the stage is laid out.
  const onStageLayout = (e: LayoutChangeEvent) => {
    if (!image) return;
    const { width: sw, height: sh } = e.nativeEvent.layout;
    const scale = Math.min(sw / image.width, sh / image.height);
    const dispW = image.width * scale;
    const dispH = image.height * scale;
    const fit = {
      x: (sw - dispW) / 2,
      y: (sh - dispH) / 2,
      width: dispW,
      height: dispH,
    };
    fitRef.current = fit;
    // Default crop = ~85% centered within the image.
    const cw = dispW * 0.85;
    const ch = dispH * 0.85;
    const initial = {
      x: fit.x + (dispW - cw) / 2,
      y: fit.y + (dispH - ch) / 2,
      width: cw,
      height: ch,
    };
    setCrop(initial);
  };

  // Drag the whole box.
  const moveResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startRef.current = cropRef.current;
        },
        onPanResponderMove: (_e, g) => {
          const fit = fitRef.current;
          const s = startRef.current;
          const x = clamp(s.x + g.dx, fit.x, fit.x + fit.width - s.width);
          const y = clamp(s.y + g.dy, fit.y, fit.y + fit.height - s.height);
          setCrop({ ...s, x, y });
        },
      }),
    [],
  );

  // One resize responder per corner. corner = [ax, ay] where 0=left/top, 1=right/bottom.
  const makeCornerResponder = (ax: 0 | 1, ay: 0 | 1) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRef.current = cropRef.current;
      },
      onPanResponderMove: (_e, g) => {
        const fit = fitRef.current;
        const s = startRef.current;
        const right = s.x + s.width;
        const bottom = s.y + s.height;

        let next = { ...s };
        if (ax === 0) {
          // left edge moves
          const newX = clamp(s.x + g.dx, fit.x, right - MIN_SIZE);
          next.x = newX;
          next.width = right - newX;
        } else {
          // right edge moves
          const newRight = clamp(
            right + g.dx,
            s.x + MIN_SIZE,
            fit.x + fit.width,
          );
          next.width = newRight - s.x;
        }
        if (ay === 0) {
          // top edge moves
          const newY = clamp(s.y + g.dy, fit.y, bottom - MIN_SIZE);
          next.y = newY;
          next.height = bottom - newY;
        } else {
          // bottom edge moves
          const newBottom = clamp(
            bottom + g.dy,
            s.y + MIN_SIZE,
            fit.y + fit.height,
          );
          next.height = newBottom - s.y;
        }
        setCrop(next);
      },
    });

  const corners = useMemo(
    () => ({
      tl: makeCornerResponder(0, 0),
      tr: makeCornerResponder(1, 0),
      bl: makeCornerResponder(0, 1),
      br: makeCornerResponder(1, 1),
    }),
    [],
  );

  const handleDone = async () => {
    if (!image || processing) return;
    const fit = fitRef.current;
    if (fit.width === 0) return;
    setProcessing(true);
    try {
      const scale = image.width / fit.width; // display px -> image px
      const originX = clamp(
        Math.round((crop.x - fit.x) * scale),
        0,
        image.width - 1,
      );
      const originY = clamp(
        Math.round((crop.y - fit.y) * scale),
        0,
        image.height - 1,
      );
      const width = clamp(
        Math.round(crop.width * scale),
        1,
        image.width - originX,
      );
      const height = clamp(
        Math.round(crop.height * scale),
        1,
        image.height - originY,
      );

      const result = await manipulateAsync(
        image.uri,
        [{ crop: { originX, originY, width, height } }],
        { compress: 0.8, format: SaveFormat.JPEG },
      );

      onDone({
        uri: result.uri,
        type: "image/jpeg",
        fileName: (image.fileName ?? `product-${Date.now()}`).replace(
          /\.\w+$/,
          ".jpg",
        ),
      });
    } catch (err) {
      console.log("Crop failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (!image) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onCancel} hitSlop={10}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crop Image</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Stage */}
        <View style={styles.stage} onLayout={onStageLayout}>
          <Image
            source={{ uri: image.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />

          {/* Dim overlay (4 rects around the crop box) */}
          <View style={[styles.dim, { left: 0, top: 0, right: 0, height: crop.y }]} />
          <View
            style={[
              styles.dim,
              { left: 0, top: crop.y + crop.height, right: 0, bottom: 0 },
            ]}
          />
          <View
            style={[
              styles.dim,
              { left: 0, top: crop.y, width: crop.x, height: crop.height },
            ]}
          />
          <View
            style={[
              styles.dim,
              {
                left: crop.x + crop.width,
                top: crop.y,
                right: 0,
                height: crop.height,
              },
            ]}
          />

          {/* Crop box */}
          <View
            {...moveResponder.panHandlers}
            style={[
              styles.cropBox,
              {
                left: crop.x,
                top: crop.y,
                width: crop.width,
                height: crop.height,
              },
            ]}
          >
            {/* Rule-of-thirds grid */}
            <View style={[styles.gridLine, styles.gridV, { left: "33.33%" }]} />
            <View style={[styles.gridLine, styles.gridV, { left: "66.66%" }]} />
            <View style={[styles.gridLine, styles.gridH, { top: "33.33%" }]} />
            <View style={[styles.gridLine, styles.gridH, { top: "66.66%" }]} />

            {/* Corner handles */}
            <View
              {...corners.tl.panHandlers}
              style={[styles.handleTouch, { left: -HANDLE / 2, top: -HANDLE / 2 }]}
            >
              <View style={[styles.corner, styles.cornerTL]} />
            </View>
            <View
              {...corners.tr.panHandlers}
              style={[styles.handleTouch, { right: -HANDLE / 2, top: -HANDLE / 2 }]}
            >
              <View style={[styles.corner, styles.cornerTR]} />
            </View>
            <View
              {...corners.bl.panHandlers}
              style={[
                styles.handleTouch,
                { left: -HANDLE / 2, bottom: -HANDLE / 2 },
              ]}
            >
              <View style={[styles.corner, styles.cornerBL]} />
            </View>
            <View
              {...corners.br.panHandlers}
              style={[
                styles.handleTouch,
                { right: -HANDLE / 2, bottom: -HANDLE / 2 },
              ]}
            >
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.hint}>
            Drag the box and corners to crop your image
          </Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={handleDone}
            disabled={processing}
            activeOpacity={0.85}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="crop" size={18} color="#FFFFFF" />
                <Text style={styles.doneBtnText}>Crop &amp; Use</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const BORDER = "#FFFFFF";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "DMSans_600SemiBold",
  },
  stage: {
    flex: 1,
    overflow: "hidden",
  },
  dim: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  cropBox: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  gridV: {
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
  },
  gridH: {
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  handleTouch: {
    position: "absolute",
    width: HANDLE,
    height: HANDLE,
    alignItems: "center",
    justifyContent: "center",
  },
  corner: {
    width: 20,
    height: 20,
    borderColor: "#1155CC",
  },
  cornerTL: {
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#000",
  },
  hint: {
    color: "#A0AEC0",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "DMSans_400Regular",
  },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1155CC",
    borderRadius: 10,
    paddingVertical: 14,
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
  },
});

export default ImageCropper;
