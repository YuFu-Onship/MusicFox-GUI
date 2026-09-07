export namespace app {
	
	export class SongDTO {
	    id: number;
	    type?: string;
	    name: string;
	    artists: string;
	    album: string;
	    picUrl: string;
	    duration: number;
	
	    static createFrom(source: any = {}) {
	        return new SongDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.name = source["name"];
	        this.artists = source["artists"];
	        this.album = source["album"];
	        this.picUrl = source["picUrl"];
	        this.duration = source["duration"];
	    }
	}
	export class LocalState {
	    theme: string;
	    volume: number;
	    bufferMB: number;
	    quality: string;
	    favorites: SongDTO[];
	    dataDir?: string;
	    bufferDir?: string;
	
	    static createFrom(source: any = {}) {
	        return new LocalState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.volume = source["volume"];
	        this.bufferMB = source["bufferMB"];
	        this.quality = source["quality"];
	        this.favorites = this.convertValues(source["favorites"], SongDTO);
	        this.dataDir = source["dataDir"];
	        this.bufferDir = source["bufferDir"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LyricDTO {
	    original: string;
	    translated: string;
	
	    static createFrom(source: any = {}) {
	        return new LyricDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.original = source["original"];
	        this.translated = source["translated"];
	    }
	}
	export class PlaySongResult {
	    ok: boolean;
	    skip: boolean;
	    message?: string;
	
	    static createFrom(source: any = {}) {
	        return new PlaySongResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ok = source["ok"];
	        this.skip = source["skip"];
	        this.message = source["message"];
	    }
	}
	export class PlayerStatus {
	    state: string;
	    position: number;
	    volume: number;
	    song?: SongDTO;
	    musicType: string;
	    seekSupported: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PlayerStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.state = source["state"];
	        this.position = source["position"];
	        this.volume = source["volume"];
	        this.song = this.convertValues(source["song"], SongDTO);
	        this.musicType = source["musicType"];
	        this.seekSupported = source["seekSupported"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SearchItem {
	    id: number;
	    name: string;
	    sub: string;
	    picUrl: string;
	    duration: number;
	
	    static createFrom(source: any = {}) {
	        return new SearchItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.sub = source["sub"];
	        this.picUrl = source["picUrl"];
	        this.duration = source["duration"];
	    }
	}
	export class SearchResp {
	    items: SearchItem[];
	    more: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SearchResp(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], SearchItem);
	        this.more = source["more"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SessionState {
	    queue: SongDTO[];
	    currentId: number;
	    position: number;
	    random: boolean;
	    singleLoop: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SessionState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.queue = this.convertValues(source["queue"], SongDTO);
	        this.currentId = source["currentId"];
	        this.position = source["position"];
	        this.random = source["random"];
	        this.singleLoop = source["singleLoop"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

