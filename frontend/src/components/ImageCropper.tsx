import { useRef, useState } from "react";
import { Image, Modal, PanResponder, StyleSheet, Text, View } from "react-native";

import {
  calculateCenteredOffset,
  calculateCropRegion,
  calculateDisplayScale,
  clampOffset,
  CropRegion,
  Point,
  zoomAroundFrameCenter,
} from "../media/cropMath";
import { PickedImage } from "../media/imageProcessing";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import ErrorMessage from "./ErrorMessage";
import PrimaryButton from "./PrimaryButton";

const CROP_FRAME_SIZE = 280;
const MINIMUM_ZOOM = 1;
const MAXIMUM_ZOOM = 4;
const ZOOM_STEP = 0.25;

type ImageCropperProps = {
  image: PickedImage;
  isSaving: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: (cropRegion: CropRegion) => void;
};

export default function ImageCropper({ image, isSaving, errorMessage, onCancel, onConfirm }: ImageCropperProps) {
  const [zoom, setZoom] = useState(MINIMUM_ZOOM);
  const [offset, setOffset] = useState<Point>(() =>
    calculateCenteredOffset(image, CROP_FRAME_SIZE, calculateDisplayScale(image, CROP_FRAME_SIZE, MINIMUM_ZOOM)),
  );
  const displayScale = calculateDisplayScale(image, CROP_FRAME_SIZE, zoom);

  const latestOffset = useRef(offset);
  const latestDisplayScale = useRef(displayScale);
  const dragStartOffset = useRef(offset);
  latestOffset.current = offset;
  latestDisplayScale.current = displayScale;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartOffset.current = latestOffset.current;
      },
      onPanResponderMove: (_event, gestureState) => {
        const draggedOffset = {
          x: dragStartOffset.current.x + gestureState.dx,
          y: dragStartOffset.current.y + gestureState.dy,
        };
        setOffset(clampOffset(draggedOffset, image, CROP_FRAME_SIZE, latestDisplayScale.current));
      },
    }),
  ).current;

  function changeZoom(zoomChange: number) {
    const nextZoom = Math.min(MAXIMUM_ZOOM, Math.max(MINIMUM_ZOOM, zoom + zoomChange));
    const nextDisplayScale = calculateDisplayScale(image, CROP_FRAME_SIZE, nextZoom);
    const zoomedOffset = zoomAroundFrameCenter(offset, displayScale, nextDisplayScale, CROP_FRAME_SIZE);
    setZoom(nextZoom);
    setOffset(clampOffset(zoomedOffset, image, CROP_FRAME_SIZE, nextDisplayScale));
  }

  function confirmCrop() {
    onConfirm(calculateCropRegion(offset, image, CROP_FRAME_SIZE, displayScale));
  }

  const imagePlacementStyle = {
    left: offset.x,
    top: offset.y,
    width: image.width * displayScale,
    height: image.height * displayScale,
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <Text style={styles.title}>Crop Profile Picture</Text>
          <Text style={styles.hint}>Drag to position. Use the buttons to zoom.</Text>
          <View style={styles.cropFrame} {...panResponder.panHandlers}>
            <Image source={{ uri: image.uri }} style={[styles.image, imagePlacementStyle]} />
            <View style={styles.pictureShapeGuide} />
          </View>
          <View style={styles.buttonRow}>
            <View style={styles.buttonSlot}>
              <PrimaryButton label="Zoom Out" onPress={() => changeZoom(-ZOOM_STEP)} isDisabled={zoom <= MINIMUM_ZOOM} />
            </View>
            <View style={styles.buttonSlot}>
              <PrimaryButton label="Zoom In" onPress={() => changeZoom(ZOOM_STEP)} isDisabled={zoom >= MAXIMUM_ZOOM} />
            </View>
          </View>
          {errorMessage && <ErrorMessage message={errorMessage} />}
          <View style={styles.buttonRow}>
            <View style={styles.buttonSlot}>
              <PrimaryButton label="Cancel" onPress={onCancel} isDisabled={isSaving} />
            </View>
            <View style={styles.buttonSlot}>
              <PrimaryButton label="Save" onPress={confirmCrop} isLoading={isSaving} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.large,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  panel: {
    width: "100%",
    maxWidth: 360,
    gap: spacing.medium,
    padding: spacing.large,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  hint: {
    color: colors.textSecondary,
  },
  cropFrame: {
    width: CROP_FRAME_SIZE,
    height: CROP_FRAME_SIZE,
    alignSelf: "center",
    overflow: "hidden",
    backgroundColor: colors.textPrimary,
  },
  image: {
    position: "absolute",
    pointerEvents: "none",
  },
  pictureShapeGuide: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CROP_FRAME_SIZE / 4,
    borderWidth: 2,
    borderColor: colors.onPrimary,
    pointerEvents: "none",
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.small,
  },
  buttonSlot: {
    flex: 1,
  },
});
