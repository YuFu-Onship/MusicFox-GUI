export namespace main {
	
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
	export class SongDTO {
	    id: number;
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
	        this.name = source["name"];
	        this.artists = source["artists"];
	        this.album = source["album"];
	        this.picUrl = source["picUrl"];
	        this.duration = source["duration"];
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

}

