import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Navbar from '../components/Navbar';
import WalletCardCarousel from '../components/WalletCardCarousel';
import LinearGradient from 'react-native-linear-gradient';
import BottomNav from '../components/BottomNav';

export default function BankSystem({ navigation }) {
  return (
    <View style={styles.container} showsVerticalScrollIndicator={false}>
      <Navbar title="Bank" />

      <ScrollView style={styles.safe}>
        {/* CARD */}
        <WalletCardCarousel />

        {/* ACTIONS */}
        <View style={styles.actionsRow}>
          <Action icon="person-outline" label="Account" color="#FCE8E6" />
          <Action
            icon="swap-horizontal-outline"
            label="Transfer"
            color="#DFF4FB"
          />
          <Action icon="journal-outline" label="Ledger" color="#E6F7E9" />
          <Action icon="analytics-outline" label="Analytics" color="#FFF2C6" />
        </View>

        <View style={styles.actionsRowFun}>
          <ActionFunction
            icon="person-outline"
            label="Account"
            color="#FCE8E6"
            onPress={() => navigation.navigate('Account')}
          />
          <ActionFunction
            icon="swap-horizontal-outline"
            label="Transfer"
            color="#DFF4FB"
          />
          <ActionFunction
            icon="journal-outline"
            label="Ledger"
            color="#E6F7E9"
            onPress={() => navigation.navigate('Ledger', { client: item })}
          />
          <ActionFunction
            icon="analytics-outline"
            label="Analytics"
            color="#FFF2C6"
          />
        </View>

        {/* ACTIVITIES */}
        <View style={styles.activitiesHeader}>
          <Text style={styles.activitiesTitle}>Activities</Text>
        </View>

        <Text style={styles.subTitle}>Recent Transfers</Text>

        {/* AVATARS */}
        <View style={styles.avatarRow}>
          {[1, 2, 3, 4].map((_, i) => (
            <Image
              key={i}
              source={{ uri: `https://i.pravatar.cc/150?img=${i + 10}` }}
              style={styles.avatar}
            />
          ))}
        </View>
      </ScrollView>

      <BottomNav navigation={navigation} active="bank" />
    </View>
  );
}

/* ACTION BUTTON */
const Action = ({ icon, label, color, onPress }) => (
  <View style={styles.actionItem}>
    <TouchableOpacity style={[styles.actionIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={20} color="#111827" />
    </TouchableOpacity>
    <Text style={styles.actionLabel}>{label}</Text>
  </View>
);

const ActionFunction = ({ icon, label, color, onPress }) => (
  <View style={styles.actionItemFun}>
    <TouchableOpacity
      style={[styles.actionIconFun, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={25} color="#111827" />
    </TouchableOpacity>
    <Text style={styles.actionLabelFun}>{label}</Text>
  </View>
);

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  safe: {
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },

  /* Abstract Shapes */
  shapeLeft: {
    position: 'absolute',
    width: 220,
    height: 220,
    backgroundColor: '#04ff5cff',
    opacity: 0.35,
    borderRadius: 110,
    top: -80,
    left: -100,
    transform: [{ rotate: '25deg' }],
  },

  shapeRight: {
    position: 'absolute',
    width: 260,
    height: 260,
    backgroundColor: '#60A5FA',
    opacity: 0.55,
    borderRadius: 130,
    bottom: -120,
    right: -120,
    transform: [{ rotate: '-20deg' }],
  },

  /* ACTIONS */
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 28,
    marginTop: 20,
  },
  actionItem: {
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#DFF5EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },

  /* ACTIONS FUNCTION*/
  actionsRowFun: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  actionItemFun: {
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
    gap: 6,
  },
  actionIconFun: {
    width: '100%',
    height: 82,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabelFun: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },

  /* ACTIVITIES */
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activitiesTitle: {
    fontSize: 22,
    marginTop: 15,
    fontWeight: '700',
  },
  addBtn: {
    backgroundColor: '#CDEAFE',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subTitle: {
    marginTop: 14,
    color: '#6B7280',
    fontSize: 13,
  },

  /* AVATARS */
  avatarRow: {
    flexDirection: 'row',
    marginTop: 14,
    marginBottom: 150,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: -10,
    borderWidth: 2,
    borderColor: '#F6F7F9',
  },
});
