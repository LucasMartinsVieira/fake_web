const DATABASE_NAME = "fake-web-assets";
const DATABASE_VERSION = 1;
const STORE_NAME = "assets";

interface StoredAssetRecord {
  id: string;
  blob: Blob;
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open asset database."));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed."));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
  });
}

function createAssetId() {
  return `asset-${crypto.randomUUID()}`;
}

export async function saveAssetBlob(blob: Blob, assetId = createAssetId()) {
  await withStore("readwrite", (store) =>
    store.put({
      id: assetId,
      blob,
    } satisfies StoredAssetRecord),
  );

  return assetId;
}

export async function saveAssetFile(file: File, assetId?: string) {
  return saveAssetBlob(file, assetId);
}

export async function saveAssetDataUrl(dataUrl: string, assetId?: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return saveAssetBlob(blob, assetId);
}

export async function loadAssetBlob(assetId: string) {
  const record = await withStore<StoredAssetRecord | undefined>("readonly", (
    store,
  ) => store.get(assetId));

  return record?.blob ?? null;
}

export async function deleteAsset(assetId: string) {
  await withStore("readwrite", (store) => store.delete(assetId));
}

export async function listAssetIds() {
  const ids = await withStore<IDBValidKey[]>("readonly", (store) =>
    store.getAllKeys(),
  );

  return ids.map((value) => String(value));
}

export async function syncStoredAssets(referencedAssetIds: string[]) {
  const referencedIds = new Set(referencedAssetIds);
  const storedIds = await listAssetIds();

  await Promise.all(
    storedIds
      .filter((assetId) => !referencedIds.has(assetId))
      .map((assetId) => deleteAsset(assetId)),
  );
}
