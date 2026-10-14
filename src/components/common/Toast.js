import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const toastConfig = {
  success: (props) => (
    <View style={[styles.toastContainer, styles.successToast]}>
      <MaterialCommunityIcons name="check-circle" size={22} color="#10b981" />
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>{props.text1}</Text>
        {props.text2 ? <Text style={styles.subText}>{props.text2}</Text> : null}
      </View>
    </View>
  ),
  error: (props) => (
    <View style={[styles.toastContainer, styles.errorToast]}>
      <MaterialCommunityIcons name="alert-circle" size={22} color="#f43f5e" />
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>{props.text1}</Text>
        {props.text2 ? <Text style={styles.subText}>{props.text2}</Text> : null}
      </View>
    </View>
  ),
  info: (props) => (
    <View style={[styles.toastContainer, styles.infoToast]}>
      <MaterialCommunityIcons name="information" size={22} color="#6366f1" />
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>{props.text1}</Text>
        {props.text2 ? <Text style={styles.subText}>{props.text2}</Text> : null}
      </View>
    </View>
  ),
};

export const showSuccessToast = (text1, text2) => {
  Toast.show({
    type: 'success',
    text1,
    text2,
    position: 'bottom',
    visibilityTime: 3000,
  });
};

export const showErrorToast = (text1, text2) => {
  Toast.show({
    type: 'error',
    text1,
    text2,
    position: 'bottom',
    visibilityTime: 4000,
  });
};

export const showInfoToast = (text1, text2) => {
  Toast.show({
    type: 'info',
    text1,
    text2,
    position: 'bottom',
    visibilityTime: 3000,
  });
};

const styles = StyleSheet.create({
  toastContainer: {
    width: '90%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2029',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  successToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  errorToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#f43f5e',
  },
  infoToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  subText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
});

export default Toast;
