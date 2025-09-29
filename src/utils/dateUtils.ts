// 日付操作関連のユーティリティ関数
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import relativeTime from 'dayjs/plugin/relativeTime';

// Day.jsプラグインの設定
dayjs.locale('ja');
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);
dayjs.extend(relativeTime);

/**
 * 日付をYYYY-MM-DD形式の文字列に変換
 */
export const formatDateToString = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

/**
 * 日付を日本語形式で表示（例：2025年1月25日）
 */
export const formatDateToJapanese = (date: Date | string): string => {
  return dayjs(date).format('YYYY年MM月DD日');
};

/**
 * 日付を短縮日本語形式で表示（例：1/25）
 */
export const formatDateToShort = (date: Date | string): string => {
  return dayjs(date).format('M/D');
};

/**
 * 相対時間を取得（例：2時間前、3日後）
 */
export const getRelativeTime = (date: Date | string): string => {
  return dayjs(date).fromNow();
};

/**
 * 2つの日付の間の日数を計算
 */
export const getDaysBetween = (startDate: Date | string, endDate: Date | string): number => {
  return dayjs(endDate).diff(dayjs(startDate), 'day');
};

/**
 * 指定した日付が今日かどうかをチェック
 */
export const isToday = (date: Date | string): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

/**
 * 指定した日付が過去かどうかをチェック
 */
export const isPastDate = (date: Date | string): boolean => {
  return dayjs(date).isBefore(dayjs(), 'day');
};

/**
 * 指定した日付が未来かどうかをチェック
 */
export const isFutureDate = (date: Date | string): boolean => {
  return dayjs(date).isAfter(dayjs(), 'day');
};

/**
 * 週の開始日を取得（月曜日）
 */
export const getWeekStart = (date?: Date | string): Date => {
  return dayjs(date).startOf('isoWeek').toDate();
};

/**
 * 週の終了日を取得（日曜日）
 */
export const getWeekEnd = (date?: Date | string): Date => {
  return dayjs(date).endOf('isoWeek').toDate();
};

/**
 * 月の開始日を取得
 */
export const getMonthStart = (date?: Date | string): Date => {
  return dayjs(date).startOf('month').toDate();
};

/**
 * 月の終了日を取得
 */
export const getMonthEnd = (date?: Date | string): Date => {
  return dayjs(date).endOf('month').toDate();
};

/**
 * 指定期間の日付配列を生成
 */
export const getDateRange = (startDate: Date | string, endDate: Date | string): Date[] => {
  const dates: Date[] = [];
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);

  while (currentDate.isBefore(end) || currentDate.isSame(end)) {
    dates.push(currentDate.toDate());
    currentDate = currentDate.add(1, 'day');
  }

  return dates;
};

/**
 * 日付が土日祝日かどうかをチェック（簡易版）
 */
export const isWeekend = (date: Date | string): boolean => {
  const dayOfWeek = dayjs(date).day();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0: 日曜日, 6: 土曜日
};

/**
 * ガントチャート表示用の日付ラベルを生成
 */
export const generateDateLabels = (
  startDate: Date | string,
  endDate: Date | string,
  format: 'day' | 'week' | 'month' = 'day'
): string[] => {
  const labels: string[] = [];
  let current = dayjs(startDate);
  const end = dayjs(endDate);

  while (current.isBefore(end) || current.isSame(end)) {
    switch (format) {
      case 'day':
        labels.push(current.format('M/D'));
        current = current.add(1, 'day');
        break;
      case 'week':
        labels.push(`${current.format('M/D')}週`);
        current = current.add(1, 'week');
        break;
      case 'month':
        labels.push(current.format('YYYY年M月'));
        current = current.add(1, 'month');
        break;
    }
  }

  return labels;
};