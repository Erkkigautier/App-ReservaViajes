import * as DocumentPicker from 'expo-document-picker';
import { Image, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { Receipt } from '../types';
import { colors } from '../theme';
import { Button } from './ui';

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Permite elegir una foto o un PDF de la boleta/factura.
export async function pickReceipt(): Promise<Receipt | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'application/pdf'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  // En web el uri es temporal (blob:), así que se guarda como data URL para que el conductor pueda verlo después.
  const uri = Platform.OS === 'web' && asset.file ? await readAsDataUrl(asset.file) : asset.uri;
  return { name: asset.name, uri, mimeType: asset.mimeType };
}

export function isImage(receipt: Receipt) {
  return (receipt.mimeType ?? '').startsWith('image/') || /\.(png|jpe?g|webp|heic)$/i.test(receipt.name);
}

export async function openReceipt(receipt: Receipt) {
  if (Platform.OS === 'web' && receipt.uri.startsWith('data:')) {
    const blob = await (await fetch(receipt.uri)).blob();
    window.open(URL.createObjectURL(blob), '_blank');
    return;
  }
  await Linking.openURL(receipt.uri);
}

export function ReceiptPreview({ receipt, height = 160 }: { receipt: Receipt; height?: number }) {
  return (
    <View style={styles.box}>
      {isImage(receipt) ? (
        <Image source={{ uri: receipt.uri }} style={{ width: '100%', height }} resizeMode="contain" />
      ) : (
        <View style={styles.pdf}>
          <Text style={styles.pdfBadge}>PDF</Text>
        </View>
      )}
      <View style={styles.footer}>
        <Text style={styles.name} numberOfLines={1}>
          {receipt.name}
        </Text>
        <Button title="Abrir" variant="secondary" onPress={() => openReceipt(receipt)} style={styles.open} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden', backgroundColor: '#FAFAFA' },
  pdf: { height: 80, alignItems: 'center', justifyContent: 'center' },
  pdfBadge: {
    backgroundColor: colors.danger,
    color: '#fff',
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  footer: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 8, borderTopWidth: 1, borderTopColor: '#EEE' },
  name: { flex: 1, fontSize: 13, color: colors.text },
  open: { paddingVertical: 6, paddingHorizontal: 12 },
});
