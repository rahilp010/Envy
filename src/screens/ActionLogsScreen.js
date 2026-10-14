import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/common/AppHeader';
import SearchBar from '../components/common/SearchBar';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import {
  getActionLogs,
  clearActionLogs,
  cleanUpOldActionLogs,
} from '../database/handlers/actionLogHandlers';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ACTION_TYPES = ['ALL', 'CREATE', 'UPDATE', 'DELETE', 'TRANSFER'];

export default function ActionLogsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [selectedType, setSelectedType] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await getActionLogs({
        actionType: selectedType,
        search,
        limit: 100,
      });
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load action logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedType, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Audit Trail',
      'Are you sure you want to delete all action log entries? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearActionLogs();
            loadData();
          },
        },
      ]
    );
  };

  const handleCleanOld = async () => {
    await cleanUpOldActionLogs(30);
    Alert.alert('Success', 'Removed audit logs older than 30 days');
    loadData();
  };

  const getActionColor = (type) => {
    switch (type) {
      case 'CREATE':
        return '#10b981';
      case 'UPDATE':
        return '#38bdf8';
      case 'DELETE':
        return '#f43f5e';
      case 'TRANSFER':
        return '#f59e0b';
      default:
        return '#94a3b8';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Audit Logs"
        subtitle="System Activity & Operations History"
        leftAction="menu"
        rightAction={handleClear}
        rightIcon="delete-sweep-outline"
      />

      <View style={styles.topWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search activity, entities, notes..."
        />

        {/* Filter Chips */}
        <View style={styles.chipsRow}>
          {ACTION_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, selectedType === type && styles.chipActive]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[styles.chipText, selectedType === type && styles.chipTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={handleCleanOld} style={styles.cleanChip}>
            <MaterialCommunityIcons name="clock-outline" size={12} color="#64748b" />
            <Text style={styles.cleanText}>&gt;30d</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <Loader fullScreen={false} message="Loading activity trail..." />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#daf4aa" />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No Logs Recorded"
              description="No database operations recorded matching this criteria."
            />
          }
          renderItem={({ item }) => {
            const color = getActionColor(item.actionType);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.badge, { backgroundColor: `${color}18` }]}>
                    <Text style={[styles.badgeText, { color }]}>{item.actionType}</Text>
                  </View>
                  <Text style={styles.moduleText}>{item.module}</Text>
                  <Text style={styles.timeText}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : '-'}
                  </Text>
                </View>

                <Text style={styles.titleText}>{item.title}</Text>
                {item.details ? <Text style={styles.detailsText}>{item.details}</Text> : null}

                {item.amount ? (
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Amount:</Text>
                    <Text style={styles.amountVal}>₹{parseFloat(item.amount).toFixed(2)}</Text>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  topWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#161d2d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  chipActive: {
    backgroundColor: 'rgba(218, 244, 170, 0.15)',
    borderColor: '#daf4aa',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#daf4aa',
  },
  cleanChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#161d2d',
  },
  cleanText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#161d2d',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  moduleText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  timeText: {
    color: '#64748b',
    fontSize: 10,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  detailsText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  amountRow: {
    flexDirection: 'row',
    marginTop: 6,
    alignItems: 'center',
  },
  amountLabel: {
    color: '#64748b',
    fontSize: 11,
  },
  amountVal: {
    color: '#daf4aa',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
});
