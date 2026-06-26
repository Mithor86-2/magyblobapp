/**
 * Adaptador de persistencia para el middleware `persist` de Zustand.
 * Aísla el detalle de infraestructura (AsyncStorage) del store de presentación.
 */
import { createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const persistStorage = createJSONStorage(() => AsyncStorage);
