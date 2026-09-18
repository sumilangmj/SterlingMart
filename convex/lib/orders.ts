export function isLiveOrder(order: { demoKey?: string }) {
  return !order.demoKey;
}
