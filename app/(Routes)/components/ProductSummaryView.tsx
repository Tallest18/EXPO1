import React from "react";
import { Image, Text, View } from "react-native";
import { styles } from "../ProductDetails.styles";

export interface SummaryRowData {
  label: string;
  value: string;
}

export interface SummarySection {
  title: string;
  rows: SummaryRowData[];
}

interface Props {
  imageUri?: string | null;
  sections: SummarySection[];
  /** Rendered at the bottom (e.g. an Edit or Save button). */
  footer?: React.ReactNode;
}

/**
 * Shared, presentational product summary used both on the ProductDetails
 * screen and as the review step of the Add/Edit Product flow, so the layout
 * stays consistent everywhere. It only renders content — callers provide the
 * scroll container and any header.
 */
const ProductSummaryView: React.FC<Props> = ({ imageUri, sections, footer }) => (
  <>
    {/* Product image */}
    <View style={styles.imageContainer}>
      <Image
        source={
          imageUri
            ? { uri: imageUri }
            : require("../../../assets/images/noImg.jpg")
        }
        style={styles.productImage}
      />
    </View>

    {sections.map((section) => (
      <View key={section.title} style={styles.section}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {section.rows.map((row, index) => (
          <View
            key={row.label}
            style={[
              styles.row,
              index === section.rows.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
      </View>
    ))}

    {footer ? <View style={styles.bottomContainer}>{footer}</View> : null}
  </>
);

export default ProductSummaryView;
