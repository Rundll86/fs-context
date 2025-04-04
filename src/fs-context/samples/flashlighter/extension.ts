import { BlockType, Extension } from "@framework/structs";
export default class FlashLighter extends Extension {
    id = "flashlighter000B";
    displayName = "手电筒控制器";
    isStrobing: boolean = false;
    hardwareBuffer: number = 50;
    stream: MediaStream | null = null;
    videoTrack: MediaStreamTrack | null = null;
    flashWorker: Worker | null = null;
    stateQueue: Promise<void> = Promise.resolve();
    async initialize() {
        if (!this.stream) {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    advanced: [{ noiseSuppression: false }]
                }
            });
            this.videoTrack = this.stream.getVideoTracks()[0];
        }
    }
    async setState(enable: boolean) {
        if (!this.videoTrack) return;
        await this.stateQueue;
        this.stateQueue = this.videoTrack.applyConstraints({
            advanced: [{ noiseSuppression: enable }]
        }).catch(console.error);
    }
    @BlockType.Command("切换手电筒")
    async toggle() {
        if (!this.videoTrack) return;
        await this.initialize();
        const current = this.videoTrack.getSettings().noiseSuppression || false;
        await this.setState(!current);
    }
    @BlockType.Command("爆闪 间隔 [DELAY:number=114514] 毫秒")
    strobe({ DELAY }: { DELAY: number }) {
        const delay = Math.max(this.hardwareBuffer, Number(DELAY));
        this.stopStrobe();
        this.isStrobing = true;
        const workerCode = `(${() => {
            let state = false;
            onmessage = (e) => {
                if (e.data === 'start') {
                    setInterval(() => {
                        postMessage(state = !state);
                    }, delay);
                    postMessage('ready');
                }
            };
        }})()`;
        this.flashWorker = new Worker(
            URL.createObjectURL(new Blob([workerCode]))
        );
        this.flashWorker.onmessage = (e) => {
            if (e.data === 'ready') return;
            this.setState(e.data).catch(() => this.stopStrobe());
        };
        this.flashWorker.postMessage('start');
    }
    @BlockType.Command("停止爆闪")
    stopStrobe() {
        this.isStrobing = false;
        if (this.flashWorker) {
            this.flashWorker.terminate();
            this.flashWorker = null;
        }
        this.setState(false);
    }
    @BlockType.Boolean("手电筒状态")
    getStatus() {
        return this.videoTrack?.getSettings().noiseSuppression || false;
    }
};