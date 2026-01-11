# 🔒 STABILITY GUIDE - Kritik Kod Koruma Rehberi

## ⚠️ UYARI
Bu dosya, uygulamanın kararlılığını korumak için kritik pattern'leri içerir.
**BU PATTERN'LERİ DEĞİŞTİRMEYİN veya İHMAL ETMEYİN.**

---

## 🎯 Temel Prensipler

### 1. Component Lifecycle Yönetimi

**❌ YANLIŞ:**
```typescript
useEffect(() => {
  fetchData().then(data => setState(data));
}, []);
```

**✅ DOĞRU:**
```typescript
const isMountedRef = useRef(true);

useEffect(() => {
  isMountedRef.current = true;
  const abortController = new AbortController();
  
  fetchData(abortController.signal).then(data => {
    if (isMountedRef.current) {
      setState(data);
    }
  });
  
  return () => {
    isMountedRef.current = false;
    abortController.abort();
  };
}, []);
```

### 2. State Update Pattern

**❌ YANLIŞ:**
```typescript
const [cart, setCart] = useState([]);

const addToCart = useCallback((item) => {
  setCart([...cart, item]); // ❌ cart değerini direkt kullanıyor
}, [cart]); // ❌ cart dependency gerekiyor
```

**✅ DOĞRU:**
```typescript
const [cart, setCart] = useState([]);

const addToCart = useCallback((item) => {
  setCart(prevCart => [...prevCart, item]); // ✅ Functional update
}, []); // ✅ Dependency gerekmiyor
```

### 3. API Call Pattern

**❌ YANLIŞ:**
```typescript
useEffect(() => {
  fetch('/api/data').then(res => res.json()).then(data => setData(data));
}, []);
```

**✅ DOĞRU:**
```typescript
useEffect(() => {
  const abortController = new AbortController();
  const signal = abortController.signal;
  
  fetch('/api/data', { signal })
    .then(res => {
      if (signal.aborted || !isMountedRef.current) return;
      return res.json();
    })
    .then(data => {
      if (signal.aborted || !isMountedRef.current) return;
      setData(data);
    })
    .catch(error => {
      if (error.name === 'AbortError') return;
      // Handle error
    });
    
  return () => {
    abortController.abort();
  };
}, []);
```

### 4. Array/Type Safety

**❌ YANLIŞ:**
```typescript
const items = data.items; // ❌ data.items undefined olabilir
items.map(item => ...); // ❌ Runtime error
```

**✅ DOĞRU:**
```typescript
const items = Array.isArray(data?.items) ? data.items : [];
items.map(item => ...); // ✅ Güvenli
```

### 5. Next.js 15 Params Handling

**❌ YANLIŞ:**
```typescript
const params = useParams();
const id = params.id; // ❌ Next.js 15'te Promise olabilir
```

**✅ DOĞRU:**
```typescript
const params = useParams();
const [id, setId] = useState(null);
const [loaded, setLoaded] = useState(false);

useEffect(() => {
  const resolve = async () => {
    const resolved = params instanceof Promise ? await params : params;
    setId(resolved?.id);
    setLoaded(true);
  };
  resolve();
}, [params]);
```

---

## 📋 Checklist - Her Değişiklikten Önce

- [ ] `isMountedRef` kontrolü tüm state update'lerden önce var mı?
- [ ] Functional state update kullanılıyor mu? (`setState(prev => ...)`)
- [ ] `AbortController` API call'larda kullanılıyor mu?
- [ ] Array işlemlerinden önce `Array.isArray()` kontrolü var mı?
- [ ] Number işlemlerinde `isNaN()` ve `isFinite()` kontrolü var mı?
- [ ] `useCallback` dependency array'leri doğru mu?
- [ ] `useMemo` dependency array'leri doğru mu?
- [ ] Try-catch blokları tüm async işlemlerde var mı?
- [ ] `AbortError` gracefully handle ediliyor mu?
- [ ] Next.js 15 params Promise olarak handle ediliyor mu?

---

## 🚨 Sık Yapılan Hatalar

### Hata 1: State Update After Unmount
```typescript
// ❌ YANLIŞ
useEffect(() => {
  fetchData().then(data => setData(data));
}, []);

// ✅ DOĞRU
useEffect(() => {
  let isMounted = true;
  fetchData().then(data => {
    if (isMounted) setData(data);
  });
  return () => { isMounted = false; };
}, []);
```

### Hata 2: Stale Closures
```typescript
// ❌ YANLIŞ
const [count, setCount] = useState(0);
const increment = useCallback(() => {
  setCount(count + 1); // ❌ Eski count değerini kullanır
}, [count]);

// ✅ DOĞRU
const increment = useCallback(() => {
  setCount(prev => prev + 1); // ✅ Güncel değeri kullanır
}, []);
```

### Hata 3: Missing AbortController
```typescript
// ❌ YANLIŞ
useEffect(() => {
  fetch('/api/data').then(...);
}, []);

// ✅ DOĞRU
useEffect(() => {
  const controller = new AbortController();
  fetch('/api/data', { signal: controller.signal }).then(...);
  return () => controller.abort();
}, []);
```

---

## 📝 Kod İnceleme Kuralları

1. **Her PR'da kontrol edin:**
   - `isMountedRef` pattern'i korunuyor mu?
   - Functional state updates kullanılıyor mu?
   - AbortController pattern'i var mı?

2. **Test senaryoları:**
   - Component unmount olurken API call yapılırsa?
   - Rapid state updates olursa?
   - Network error olursa?
   - Invalid data gelirse?

3. **Performance:**
   - Gereksiz re-render var mı?
   - Memory leak riski var mı?
   - Infinite loop riski var mı?

---

## 🔗 İlgili Dosyalar

- `app/admin-panel/bayi/satis/[dealerId]/page.tsx` - Örnek implementation
- `lib/hooks/useSafeState.ts` - Reusable hooks
- Bu dosya sürekli güncellenmelidir

---

**Son Güncelleme:** 2025-01-10
**Versiyon:** 1.0.0
