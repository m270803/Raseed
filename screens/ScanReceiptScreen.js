// ScanReceiptScreen.js
// QR Scan + Image Pick + OCR.space API (Expo Go Compatible)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation } from '@react-navigation/native';

/* 🔑 PUT YOUR OCR.space API KEY HERE */
const OCR_SPACE_API_KEY = "K87283662888957";

export default function ScanReceiptScreen() {
  const navigation = useNavigation();

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [scannedOnce, setScannedOnce] = useState(false);

  const [imageUri, setImageUri] = useState(null);
  const [rawData, setRawData] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------------------------------------------------
     Camera Permission
  --------------------------------------------------- */
  useEffect(() => {
    if (!permission) requestPermission();
  }, []);

  const ensureCameraPermission = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Camera Permission", "Camera permission is required.");
        return false;
      }
    }
    return true;
  };

  /* ---------------------------------------------------
     QR SCAN
  --------------------------------------------------- */
  const startQrScan = async () => {
    const ok = await ensureCameraPermission();
    if (!ok) return;

    setImageUri(null);
    setRawData('');
    setAmount('');
    setTitle('');
    setItems([]);
    setScannedOnce(false);
    setIsCameraVisible(true);
  };

  const handleBarcodeScanned = ({ data }) => {
    if (scannedOnce) return;
    setScannedOnce(true);
    setIsCameraVisible(false);
    parseQR(data);
  };

  const parseQR = (text) => {
    setRawData(text);
    setItems([]);

    let t = "Scanned Receipt";
    let a = "";

    try {
      const obj = JSON.parse(text);
      if (obj.title) t = obj.title;
      if (obj.amount) a = String(obj.amount);
    } catch {}

    const num = text.match(/(\d+(\.\d+)?)/);
    if (num) a = num[1];

    setTitle(t);
    setAmount(a);
  };

  /* ---------------------------------------------------
     PICK IMAGE → COMPRESS → SEND TO OCR.space
  --------------------------------------------------- */
  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Gallery access is needed.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: false,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);

      setRawData('');
      setTitle('');
      setAmount('');
      setItems([]);

      // compress + get base64 for OCR.space
      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      runOCRSpace(compressed.base64);
    }
  };

  /* ---------------------------------------------------
     OCR.space OCR API
  --------------------------------------------------- */
  const runOCRSpace = async (base64) => {
    setLoading(true);
    try {
      const formData = new FormData();

      formData.append("apikey", OCR_SPACE_API_KEY);
      formData.append("base64Image", `data:image/jpeg;base64,${base64}`);
      formData.append("language", "eng"); // English receipts
      formData.append("isTable", "true"); // better for line items

      const res = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const json = await res.json();

      if (json?.IsErroredOnProcessing) {
        Alert.alert("OCR Error", json.ErrorMessage?.[0] || "OCR failed.");
        setLoading(false);
        return;
      }

      const text = json?.ParsedResults?.[0]?.ParsedText || "";

      if (!text.trim()) {
        Alert.alert("OCR Error", "No text detected, try a clearer image.");
        setLoading(false);
        return;
      }

      setRawData(text);
      extractFromOCR(text);
    } catch (err) {
      Alert.alert("OCR Error", "Unable to process the image.");
    }

    setLoading(false);
  };

  /* ---------------------------------------------------
     PARSE ITEMS 
  --------------------------------------------------- */
  const extractItemsFromText = (text) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const result = [];

    const startIdx = lines.findIndex((l) =>
      l.toLowerCase().includes("sn description")
    );

    if (startIdx === -1) return result;

    let currentName = null;

    for (let i = startIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim().replace(/\s+/g, " ");
      const lower = line.toLowerCase();

      if (
        lower.includes("net qty") ||
        lower.includes("bill total") ||
        lower.includes("payable")
      ) {
        break;
      }

      const serialMatch = line.match(/^(\d+)\s+(.+)/);
      if (serialMatch) {
        currentName = serialMatch[2].trim();
        continue;
      }

      const nums = line.match(/(\d+(\.\d+)?)/g);
      if (nums?.length >= 3 && currentName) {
        result.push({
          name: currentName,
          qty: nums[0],
          rate: nums[1],
          amount: nums[2],
        });
        currentName = null;
      }
    }

    return result;
  };

  /* ---------------------------------------------------
     EXTRACT TITLE + AMOUNT + ITEMS
  --------------------------------------------------- */
  const extractFromOCR = (text) => {
    if (!text) return;

    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const guessedTitle = lines[0] || "Scanned Receipt";

    const payable = text.match(/Payable\s*Amt\s*[:\-]?\s*(\d+(\.\d+)?)/i);
    const billTotal = text.match(/Bill\s*Total\s*[:\-]?\s*(\d+(\.\d+)?)/i);
    const rupee = text.match(/₹\s?(\d+(\.\d+)?)/);
    const number = text.match(/(\d+(\.\d+)?)/);

    let guessedAmount = "";
    if (payable) guessedAmount = payable[1];
    else if (billTotal) guessedAmount = billTotal[1];
    else if (rupee) guessedAmount = rupee[1];
    else if (number) guessedAmount = number[1];

    const parsedItems = extractItemsFromText(text);

    setTitle(guessedTitle);
    setAmount(guessedAmount);
    setItems(parsedItems);
  };

  /* ---------------------------------------------------
     SEND TO ADD EXPENSE
  --------------------------------------------------- */
  const goToAddExpense = () => {
    navigation.navigate("AddExpense", {
      fromScan: true,
      prefillTitle: title,
      prefillAmount: amount,
    });
  };

  /* ---------------------------------------------------
     UI (unchanged)
  --------------------------------------------------- */
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Receipt</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={startQrScan}>
            <Ionicons name="qr-code-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Scan QR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnOutline} onPress={pickImageFromGallery}>
            <Ionicons name="image-outline" size={20} color="#1c2b48" />
            <Text style={styles.actionTextOutline}>Pick Receipt</Text>
          </TouchableOpacity>
        </View>

        {isCameraVisible && (
          <View style={styles.cameraWrapper}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraText}>Point at QR code</Text>
            </View>
          </View>
        )}

        {imageUri && (
          <View style={styles.imageCard}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            {loading && <ActivityIndicator style={{ marginTop: 8 }} />}
          </View>
        )}

        <View style={styles.detailsCard}>
          <Text style={styles.detailsHeading}>Detected Details</Text>

          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.fieldInput}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.fieldLabel}>Amount (₹)</Text>
          <TextInput
            style={styles.fieldInput}
            value={amount}
            keyboardType="numeric"
            onChangeText={setAmount}
          />

          {items.length > 0 && (
            <>
              <Text style={styles.itemsHeading}>Items Detected</Text>
              {items.map((it, index) => (
                <Text key={index} style={styles.itemLine}>
                  • {it.name} — Qty: {it.qty} × {it.rate} = {it.amount}
                </Text>
              ))}
            </>
          )}

          {rawData ? (
            <>
              <Text style={styles.fieldLabel}>Raw OCR Text</Text>
              <Text style={styles.rawBox}>{rawData}</Text>
            </>
          ) : null}

          <TouchableOpacity style={styles.primaryBtn} onPress={goToAddExpense}>
            <Text style={styles.primaryBtnText}>Use in Add Expense</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------ STYLES (unchanged) ------------------ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8fa" },
  header: { backgroundColor: "#1c2b48", paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  content: { padding: 20, paddingBottom: 40 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  actionBtn: {
    flexDirection: "row",
    backgroundColor: "#1c2b48",
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    marginRight: 6,
  },
  actionBtnOutline: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#1c2b48",
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    marginLeft: 6,
  },
  actionText: { color: "#fff", marginLeft: 6, fontWeight: "600" },
  actionTextOutline: { color: "#1c2b48", marginLeft: 6, fontWeight: "600" },
  cameraWrapper: { height: 260, borderRadius: 16, overflow: "hidden", marginBottom: 18 },
  cameraOverlay: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cameraText: { color: "#fff", fontSize: 12 },
  imageCard: { backgroundColor: "#fff", borderRadius: 16, padding: 12, marginBottom: 16 },
  image: { width: "100%", height: 180, borderRadius: 10 },
  detailsCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16 },
  detailsHeading: { fontSize: 16, fontWeight: "700", color: "#1c2b48", marginBottom: 10 },
  fieldLabel: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#1c2b48",
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#f9fafb",
    fontSize: 14,
  },
  itemsHeading: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#1c2b48",
  },
  itemLine: { fontSize: 12, color: "#334155", marginBottom: 2 },
  rawBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    backgroundColor: "#f9fafb",
  },
  primaryBtn: {
    backgroundColor: "#1c2b48",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});