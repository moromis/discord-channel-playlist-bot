import _ from "lodash";
import Constants from "../constants";
import { store } from "../dataStore";
import { UserAuth } from "../types/userAuth";

const getAuthStore = (): UserAuth.Collection => {
  return _.clone(
    store.get<UserAuth.Collection>(
      Constants.DataStore.Keys.userAuthCollection
    ) || {}
  );
};

export default {
  getAuthStore,
};