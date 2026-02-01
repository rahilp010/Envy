/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import api from './api';
import { useTheme } from '../theme/ThemeContext';
import { DarkTheme, LightTheme } from '../theme/color';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';

const PreviewScreen = ({ navigation, route }) => {
  /* ===================== THEME ===================== */
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);

  const { html, type } = route.params;

  /* ===================== HTML SCALING FIX ===================== */
  // Injects viewport meta tag to fix "small text" issue on mobile
  const injectViewport = htmlContent => {
    const metaTag = `<meta name="viewport" content="width=1024">`;

    const css = `
    <style>
      body {
        margin: 0;
        padding: 0;
        background: #e5e7eb;
      }
      img { max-width: 100%; height: auto; }
      table { width: 100%; border-collapse: collapse; }
    </style>
  `;

    if (htmlContent.includes('<head>')) {
      return htmlContent.replace('<head>', `<head>${metaTag}${css}`);
    }

    return `<html><head>${metaTag}${css}</head><body>${htmlContent}</body></html>`;
  };

  const finalHtml = injectViewport(html);

  /* ===================== HANDLERS ===================== */
  const downloadPDF = async () => {
    try {
      const blob = await api.exportPendingPDF({ type, html });

      const filePath = `${
        RNFS.DownloadDirectoryPath
      }/pending-report-${Date.now()}.pdf`;

      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];

        await RNFS.writeFile(filePath, base64Data, 'base64');
        await FileViewer.open(filePath, { showOpenWithDialog: true });
      };
    } catch (e) {
      Alert.alert('Error', 'No PDF viewer found');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.bg}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview {type}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* DOCUMENT PREVIEW AREA */}
      <View style={styles.previewWrapper}>
        {/* Shadow Box Container */}
        <View style={styles.paperContainer}>
          <WebView
            originWhitelist={['*']}
            source={{ html: finalHtml }}
            style={styles.webview}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}
            // Fixes for Android text scaling
            scalesPageToFit={false}
            textZoom={80}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>

        {/* FLOATING ACTION BAR (BOTTOM RIGHT, HORIZONTAL) */}
        <View style={styles.floatingBar}>
          {/* DOWNLOAD */}
          <TouchableOpacity
            style={styles.floatingBtn}
            onPress={downloadPDF}
            activeOpacity={0.85}
          >
            <Icon name="download-outline" size={22} color="#fff" />
            {/* <Text style={styles.floatingText}>PDF</Text> */}
          </TouchableOpacity>

          {/* DIVIDER */}
          <View style={styles.floatingDivider} />

          {/* HOME */}
          <TouchableOpacity
            style={styles.floatingBtn}
            onPress={() => navigation.replace('HomePage')}
            activeOpacity={0.85}
          >
            <Icon name="home-outline" size={22} color="#fff" />
            {/* <Text style={styles.floatingText}>Home</Text> */}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PreviewScreen;

const createStyles = COLORS =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.bg, // Dark/Light background behind the paper
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: COLORS.bg,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: COLORS.text,
      textTransform: 'capitalize',
    },
    backBtn: {
      padding: 1,
    },

    // Preview Area
    previewWrapper: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },

    // The "Box with Shadow"
    paperContainer: {
      flex: 1,
      backgroundColor: '#ffffff', // Paper is always white
      borderRadius: 4, // Slight radius for realistic paper look
      overflow: 'hidden',
      // Heavy Shadow to pop out
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 10,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
    },

    webview: {
      flex: 1,
      backgroundColor: '#ffffff',
    },

    loader: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
    },

    // Footer
    footer: {
      padding: 16,
      backgroundColor: COLORS.card,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.05)',
      // Shadow lifting the footer
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 10,
    },
    downloadBtn: {
      backgroundColor: COLORS.primary, // Matches theme primary
      paddingVertical: 16,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 5,
    },
    downloadText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 16,
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: COLORS.primary,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 30,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 12,
    },
    fabText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 14,
      marginLeft: 8,
    },
    floatingBar: {
      position: 'absolute',
      right: 16,
      bottom: 24, // ✅ bottom-right corner
      flexDirection: 'row', // ✅ horizontal layout
      alignItems: 'center',
      backgroundColor: COLORS.primary,
      borderRadius: 30,
      paddingHorizontal: 6,
      paddingVertical: 4,

      // Shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 14,
      elevation: 15,
    },

    floatingBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
    },

    floatingText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '800',
      marginLeft: 6,
    },

    floatingDivider: {
      width: 1,
      height: 28,
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
  });
