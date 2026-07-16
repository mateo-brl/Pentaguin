import { noopProvider } from './noop.provider';
import type { PurchasesProvider } from './provider';

// react-native-purchases est temporairement retiré du build (jalon M7) : sa
// présence déclenche l'échec de l'archive iOS sur le xcframework ExpoModulesJSI
// en mode static (bug Expo SDK 57, cf. expo/expo#45484). La logique RevenueCat
// reste intacte dans revenuecat.provider.ts ; il suffira de réimporter
// createRevenueCatProvider ici et de réinstaller le package une fois le bug
// contourné, sans toucher au reste de l'app (monétisation isolée).
//
// import Constants, { ExecutionEnvironment } from 'expo-constants';
// import { monetizationConfig, purchasesConfig } from '@/config/monetization';
// import { createRevenueCatProvider } from './revenuecat.provider';
// const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
// export const activeProvider =
//   monetizationConfig.enabled && !isExpoGo && purchasesConfig.revenueCatIosKey
//     ? createRevenueCatProvider(purchasesConfig.revenueCatIosKey)
//     : noopProvider;

/** noopProvider tant que react-native-purchases n'est pas réintégré (voir ci-dessus). */
export const activeProvider: PurchasesProvider = noopProvider;
