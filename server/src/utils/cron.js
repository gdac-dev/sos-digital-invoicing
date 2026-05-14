import cron from 'node-cron';
import { prisma } from '../index.js';
import { sendReminderEmail } from './email.js';

export const startReminderCron = async () => {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running invoice reminder cron...');
    const now = new Date();

    const sentInvoices = await prisma.invoice.findMany({
      where: { status: { in: ['sent', 'viewed'] }, dueDate: { not: null } },
      include: { client: true, reminders: true },
    });

    for (const invoice of sentInvoices) {
      const daysSinceDue = Math.floor((now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));

      // Mark as overdue if past due
      if (daysSinceDue > 0 && invoice.status !== 'overdue') {
        await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'overdue' } });
      }

      // Send day 7 reminder
      if (daysSinceDue >= 7 && !invoice.reminders.find(r => r.type === 'day7')) {
        if (invoice.client.email) {
          await sendReminderEmail(invoice, 'day7');
          await prisma.emailReminder.create({ data: { invoiceId: invoice.id, type: 'day7' } });
        }
      }

      // Send day 14 reminder
      if (daysSinceDue >= 14 && !invoice.reminders.find(r => r.type === 'day14')) {
        if (invoice.client.email) {
          await sendReminderEmail(invoice, 'day14');
          await prisma.emailReminder.create({ data: { invoiceId: invoice.id, type: 'day14' } });
        }
      }
    }
    console.log(`✅ Reminders processed for ${sentInvoices.length} invoices`);
  });

  console.log('📅 Invoice reminder cron started');
};
