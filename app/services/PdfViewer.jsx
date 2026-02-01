import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const PdfViewer = ({ route }) => {
  const { url } = route.params;

  // Google Docs Viewer URL
  const pdfViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
    url,
  )}`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: pdfViewerUrl }}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator
            size="large"
            color="#111827"
            style={styles.loader}
          />
        )}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
};

export default PdfViewer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
});
