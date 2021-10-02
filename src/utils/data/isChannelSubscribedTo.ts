import { has, isEmpty } from "ramda";
import { getSubscriptions } from "../../services/subscriptionsService";


const isChannelSubscribedTo = (channelId: string): boolean => {
    const subscriptions = getSubscriptions() || {};
    return has(channelId, subscriptions) && !isEmpty(subscriptions[channelId]);
  };
  
  export default isChannelSubscribedTo;