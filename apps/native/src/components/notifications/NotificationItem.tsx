import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '@/config/colors';

interface NotificationItemProps {
  item: any;
  onPress: (item: any) => void;
  onMarkRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ item, onPress, onMarkRead }) => {
  const isRead = item.isRead;

  return (
    <TouchableOpacity
      style={[styles.container, !isRead && styles.unreadContainer]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={getIconName(item.type)}
          size={24}
          color={isRead ? AppColors.neutrals300 : AppColors.primary}
        />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, !isRead && styles.unreadText]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.time}>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })}
          </Text>
        </View>

        <Text style={[styles.body, isRead && styles.readBody]} numberOfLines={2}>
          {item.body}
        </Text>

        {!isRead && (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={() => onMarkRead(item._id)}
          >
            <Text style={styles.markReadText}>Đánh dấu đã đọc</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const getIconName = (type: string) => {
  switch (type) {
    case 'SOS':
      return 'warning'; // warning-outline not filled
    case 'ACTIVITY':
      return 'briefcase';
    case 'SYSTEM':
      return 'information-circle';
    default:
      return 'notifications';
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unreadContainer: {
    backgroundColor: '#f0f9ff', // Light blue tint for unread
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '700',
    color: '#000',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  body: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  readBody: {
    color: '#999',
  },
  markReadButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  markReadText: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: '600',
  },
});

export default NotificationItem;
