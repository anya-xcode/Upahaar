import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { NOTIFICATION_AUDIENCE, ORDER_STATUS_META } from '../utils/constants.js';

/**
 * Every notification the platform sends flows through here. Today it writes to
 * the in-app inbox; wiring email / SMS / WhatsApp later means adding a transport
 * in `dispatch` rather than hunting through controllers.
 */
async function dispatch(doc) {
  const notification = await Notification.create(doc);
  // TODO: fan out to email + SMS/WhatsApp transports once provider keys land.
  return notification;
}

export function notify({ recipient, audience, title, body, icon, type = 'GENERAL', link, meta }) {
  return dispatch({ recipient, audience, title, body, icon, type, link, meta });
}

export function notifyCustomer(userId, payload) {
  return notify({ recipient: userId, audience: NOTIFICATION_AUDIENCE.CUSTOMER, ...payload });
}

export function notifySeller(sellerUserId, payload) {
  return notify({ recipient: sellerUserId, audience: NOTIFICATION_AUDIENCE.SELLER, ...payload });
}

/** Admin alerts go to every admin — there is rarely more than a handful. */
export async function notifyAdmins(payload) {
  const admins = await User.find({ role: 'ADMIN' }).select('_id');
  return Promise.all(
    admins.map((a) =>
      notify({ recipient: a._id, audience: NOTIFICATION_AUDIENCE.ADMIN, ...payload })
    )
  );
}

/** The customer-facing message for an order status change. */
export function notifyOrderStatus(order, status) {
  const meta = ORDER_STATUS_META[status];
  if (!meta) return null;
  return notifyCustomer(order.customer, {
    title: meta.customerNote,
    body: `Order ${order.orderId}`,
    icon: meta.icon || 'order',
    type: 'ORDER',
    link: `/account/orders/${order.orderId}`,
    meta: { orderId: order.orderId, status },
  });
}
