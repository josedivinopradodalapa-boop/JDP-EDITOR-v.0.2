javascript
/* AUTORIZADO POR: Sr. José Divino Prado da Lapa - Engenheiro Sênior (jdp-160620) */
/* SISTEMA: JDP-CORE-v10.0 | ARQUITETO: HELENA */
/* ARQUIVO: service-worker.js (UNIVERSAL HIGH-PERFORMANCE) */

const CONFIG = {
    VERSION: 'JDP-ULTRA-v10.0',
    TYPE: 'UNIVERSAL-RUNTIME',
    // Estratégia: Cache First para Assets, Network First para Documentos
};

// Instalação: Força o SW a assumir o controle imediatamente (SKIP WAITING)
self.addEventListener('install', (event) => {
    console.log(`[HELENA SYSTEM] Service Worker ${CONFIG.VERSION} Instalado. Preparando motores.`);
    // Força a ativação imediata, pulando a espera
    self.skipWaiting();
});

// Ativação: Limpa caches antigos e assume controle de todas as abas abertas
self.addEventListener('activate', (event) => {
    console.log(`[HELENA SYSTEM] Service Worker ${CONFIG.VERSION} Ativo. Limpando resíduos antigos.`);
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CONFIG.VERSION) {
                        console.log(`[HELENA SYSTEM] Removendo Cache Obsoleto: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Reivindica o controle dos clientes (navegadores) imediatamente
    return self.clients.claim();
});

// O CORAÇÃO DO SISTEMA: Interceptação de Rede
self.addEventListener('fetch', (event) => {
    
    // Ignora requisições que não sejam GET (POST, PUT, etc. devem ir para a rede)
    if (event.request.method !== 'GET') return;

    // Ignora esquemas não suportados (como chrome-extension://)
    if (!event.request.url.startsWith('http')) return;

    const requestUrl = new URL(event.request.url);

    // ESTRATÉGIA 1: DOCUMENTOS HTML (Páginas)
    // Tenta Rede primeiro (para conteúdo fresco), cai para Cache se offline.
    if (event.request.mode === 'navigate' || requestUrl.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    // Se a rede respondeu, atualiza o cache e entrega a página
                    const responseClone = networkResponse.clone();
                    caches.open(CONFIG.VERSION).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return networkResponse;
                })
                .catch(() => {
                    // Se a rede falhou (OFFLINE), tenta entregar do cache
                    return caches.match(event.request).then((cachedResponse) => {
                        if (cachedResponse) return cachedResponse;
                        // Opcional: Retornar uma página de "Offline Genérica" se tiver
                        // return caches.match('/offline.html'); 
                        return new Response('<h1>JDP SYSTEM: MODO OFFLINE ATIVADO.</h1><p>Sem conexão. Reconecte para acessar esta página.</p>', {
                            headers: { 'Content-Type': 'text/html' }
                        });
                    });
                })
        );
        return;
    }

    // ESTRATÉGIA 2: ASSETS (Imagens, CSS, JS, Fontes)
    // Cache First (Velocidade Máxima), atualiza em background se necessário ou busca na rede se não tiver.
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Se tem no cache, entrega IMEDIATAMENTE (Velocidade da Luz)
            if (cachedResponse) {
                return cachedResponse;
            }

            // Se não tem, busca na rede, entrega e guarda uma cópia para o futuro
            return fetch(event.request).then((networkResponse) => {
                // Verifica se a resposta é válida
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseClone = networkResponse.clone();
                caches.open(CONFIG.VERSION).then((cache) => {
                    cache.put(event.request, responseClone);
                });

                return networkResponse;
            }).catch(() => {
                // Se falhar imagem, pode retornar um placeholder
                // if (requestUrl.pathname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
                //     return caches.match('/img/offline-placeholder.png');
                // }
            });
        })
    );
})