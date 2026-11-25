/**
 * Web version only: browsers need a tap before they allow notifications, so
 * show a "Turn on reminders" card until they are allowed (or explain how to
 * unblock them). Hidden in the Android app, which asks on its own.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';
import { AppText } from './AppText';
import { BigButton } from './BigButton';
import { enableWebNotifications, syncPaymentReminders, webNotifyState } from '../lib/notifications';
import { usePayments } from '../data/payments';

export function WebReminderCard() {
  const { t } = useTranslation();
  const { payments, nameOf } = usePayments();
  const [state, setState] = useState(webNotifyState());
  if (state === 'unsupported' || state === 'granted') return null;

  return (
    <Card title={t('webNotify.title')} icon="notifications" tone="warn">
      {state === 'denied' ? (
        <AppText>{t('webNotify.blocked')}</AppText>
      ) : (
        <>
          <AppText className="mb-3">{t('webNotify.body')}</AppText>
          <BigButton
            icon="notifications"
            label={t('webNotify.turnOn')}
            onPress={async () => {
              await enableWebNotifications();
              setState(webNotifyState());
              syncPaymentReminders(payments, nameOf);
            }}
          />
        </>
      )}
    </Card>
  );
}
