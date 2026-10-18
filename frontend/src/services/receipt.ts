import type { Item } from '../types';
import { uid } from '../utils';

/**
 * STUB — owned by the receipt-scanning teammate.
 * Replace with real OCR/parsing of the captured image.
 */
export async function parseReceipt(_image?: Blob): Promise<Item[]> {
  return [
    { id: uid(), name: 'Item 1', price: '4.99', friendIds: [1] },
    { id: uid(), name: 'Item 2', price: '4.99', friendIds: [1, 3] },
    { id: uid(), name: 'Item 3', price: '4.99', friendIds: [3] },
  ];
}
