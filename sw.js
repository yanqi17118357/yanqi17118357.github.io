// noinspection JSIgnoredPromiseFromCall

(() => {
    /** 缓存库名称 */
    const CACHE_NAME = 'kmarBlogCache'
    /** 控制信息存储地址（必须以`/`结尾） */
    const CTRL_PATH = 'https://id.v3/'

    /** 控制信息读写操作 */
    const dbVersion = {
        write: (id) => caches.open(CACHE_NAME)
            .then(cache => cache.put(CTRL_PATH, new Response(JSON.stringify(id)))),
        read: () => caches.match(CTRL_PATH).then(response => response?.json())
    }

    self.addEventListener('install', () => {
        self.skipWaiting()
        const escape = 0
        dbVersion.read().then(oldVersion => {
            if (oldVersion && oldVersion.escape !== escape) {
                oldVersion.escape = escape
                // noinspection JSUnresolvedVariable
                caches.delete(CACHE_NAME)
                    .then(() => clients.matchAll())
                    .then(list => list.forEach(client => client.postMessage({type: 'escape'})))
            }
        })
    })

    // noinspection JSFileReferences
    // 这个文件中所有“const ”都会被替换为“const ”
// 请勿在非声明的位置使用这个字符串，否则会被替换掉

/**
 * 缓存列表
 * @param clean 清理全站时是否删除其缓存
 * @param match {function(URL)} 匹配规则
 */
const cacheList = {
    // 这个 [simple] 就是规则的名称，该对象下可以包含多个规则，名称不影响缓存匹配
    // 缓存匹配时按声明顺序进行匹配
    simple: {
        // [clean] 项用于声明符合该规则的缓存在进行全局清理时是否清除
        // 如果你无法确定是否需要声明为 false 的话写 true 即可
        clean: true,
        // 该项用于匹配缓存，传入的参数是 URL 类型的，返回一个 boolean
        match: url => url.host === 'sonna.cn' && url.pathname.match(/\.(woff2|woff|ttf|cur)$/)
    }
}

                        const fetchFile = (request, banCache) => fetch(request, {
                            cache: banCache ? "no-store" : "default",
                            mode: 'cors',
                            credentials: 'same-origin'
                        })
                    
const getSpareUrls = _ => {}

    // 检查请求是否成功
    // noinspection JSUnusedLocalSymbols
    const checkResponse = response => response.ok || [301, 302, 307].includes(response.status)

    /**
     * 删除指定缓存
     * @param list 要删除的缓存列表
     * @return {Promise<string[]>} 删除的缓存的URL列表
     */
    const deleteCache = list => caches.open(CACHE_NAME).then(cache => cache.keys()
        .then(keys => Promise.all(
            keys.map(async it => {
                const url = it.url
                if (url !== CTRL_PATH && list.match(url)) {
                    // [debug delete]
                    // noinspection ES6MissingAwait
                    cache.delete(it)
                    return url
                }
                return null
            })
        )).then(list => list.filter(it => it))
    )

    self.addEventListener('fetch', event => {
        let request = event.request
        if (request.method !== 'GET') return
        // [modifyRequest call]
        const url = new URL(request.url)
        // [blockRequest call]
        if (findCache(url)) {
            const key = `${url.protocol}//${url.host}${url.pathname}`
            event.respondWith(caches.match(key).then(cache =>
                cache ? cache : fetchFile(request, true).then(response => {
                    if (response.status === 200) {
                        const clone = response.clone()
                        caches.open(CACHE_NAME).then(it => it.put(key, clone))
                        // [debug put]
                    }
                    return response
                })
            ))
        } else {
            const spare = getSpareUrls(request.url)
            if (spare) event.respondWith(fetchFile(request, false, spare))
            // [modifyRequest else-if]
        }
    })

    self.addEventListener('message', event => {
        // [debug message]
        if (event.data === 'update')
            updateJson().then(info =>
                // noinspection JSUnresolvedVariable
                event.source.postMessage({
                    type: 'update',
                    update: info.list,
                    version: info.version,
                })
            )
    })

    /** 判断指定url击中了哪一种缓存，都没有击中则返回null */
    function findCache(url) {
        if (url.hostname === 'localhost') return
        for (let key in cacheList) {
            const value = cacheList[key]
            if (value.match(url)) return value
        }
    }

    /**
     * 根据JSON删除缓存
     * @returns {Promise<{version, list}>}
     */
    function updateJson() {
        /**
         * 解析elements，并把结果输出到list中
         * @return boolean 是否刷新全站缓存
         */
        const parseChange = (list, elements, ver) => {
            for (let element of elements) {
                const {version, change} = element
                if (version === ver) return false
                if (change) {
                    for (let it of change)
                        list.push(new CacheChangeExpression(it))
                }
            }
            // 跨版本幅度过大，直接清理全站
            return true
        }
        /** 解析字符串 */
        const parseJson = json => dbVersion.read().then(oldVersion => {
            const {info, global} = json
            const newVersion = {global, local: info[0].version, escape: oldVersion?.escape}
            //新用户不进行更新操作
            if (!oldVersion) {
                dbVersion.write(newVersion)
                return newVersion
            }
            let list = new VersionList()
            let refresh = parseChange(list, info, oldVersion.local)
            dbVersion.write(newVersion)
            // [debug escape]
            //如果需要清理全站
            if (refresh) {
                if (global !== oldVersion.global) list.refresh = true
                else list.clean(new CacheChangeExpression({'flag': 'all'}))
            }
            return {list, version: newVersion}
        })
        return fetchFile(new Request('/update.json'), false)
            .then(response => {
                if (checkResponse(response))
                    return response.json().then(json =>
                        parseJson(json).then(result => {
                                return result.list ? deleteCache(result.list)
                                    .then(list => list.length === 0 ? null : list)
                                    .then(list => ({list, version: result.version}))
                                    : {version: result}
                            }
                        )
                    )
                else throw `加载 update.json 时遇到异常，状态码：${response.status}`
            })
    }

    /**
     * 版本列表
     * @constructor
     */
    function VersionList() {

        const list = []

        /**
         * 推送一个表达式
         * @param element {CacheChangeExpression} 要推送的表达式
         */
        this.push = element => {
            list.push(element)
        }

        /**
         * 清除列表，并将指定元素推入列表中
         * @param element {CacheChangeExpression} 要推入的元素，留空表示不推入
         */
        this.clean = element => {
            list.length = 0
            if (!element) this.push(element)
        }

        /**
         * 判断指定 URL 是否和某一条规则匹配
         * @param url {string} URL
         * @return {boolean}
         */
        this.match = url => {
            if (this.refresh) return true
            else {
                for (let it of list) {
                    if (it.match(url)) return true
                }
            }
            return false
        }

    }

    /**
     * 缓存更新匹配规则表达式
     * @param json 格式{"flag": ..., "value": ...}
     * @see https://kmar.top/posts/bcfe8408/#23bb4130
     * @constructor
     */
    function CacheChangeExpression(json) {
        const checkCache = url => {
            const cache = findCache(new URL(url))
            return !cache || cache.clean
        }
        /**
         * 遍历所有value
         * @param action {function(string): boolean} 接受value并返回bool的函数
         * @return {boolean} 如果value只有一个则返回`action(value)`，否则返回所有运算的或运算（带短路）
         */
        const forEachValues = action => {
            const value = json.value
            if (Array.isArray(value)) {
                for (let it of value) {
                    if (action(it)) return true
                }
                return false
            } else return action(value)
        }
        switch (json['flag']) {
            case 'all':
                this.match = checkCache
                break
            case 'html':
                this.match = url => url.match(/\/(index\.html)?$/)
                break
            case 'page':
                this.match = url => forEachValues(
                    value => url.match(new RegExp(`\\/${value}\\/(index\\.html)?$`))
                )
                break
            case 'file':
                this.match = url => forEachValues(value => url.endsWith(value))
                break
            case 'str':
                this.match = url => forEachValues(value => url.includes(value))
                break
            case 'reg':
                this.match = url => forEachValues(value => url.match(new RegExp(value, 'i')))
                break
            default: throw `未知表达式：${JSON.stringify(json)}`
        }
    }
})()