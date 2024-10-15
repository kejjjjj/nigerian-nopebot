
import { ProcessThread } from './inbox.js';
import { Delay } from './utils.js';

export class ThreadQueue
{
    constructor() {
        this.m_arrThreads = [];
        this.m_bActive = false;
    }

    HasQueue() {
        return this.m_arrThreads.length > 0;
    }

    IsActive() {
        return this.m_bActive;
    }
 
    AddThread(thread){

        if(!thread)
            throw "ThreadQueue::AddThread(): !thread";

        this.m_arrThreads.push(thread);
    }

    AbortQueue(){
        this.m_bActive = false;
    }

    async ProcessEntireQueue()
    {
        if(this.IsActive()){
           return;
        }

        this.m_bActive = true;

        while(this.m_arrThreads.length > 0){

            if(!this.IsActive()){
                break;
            }
            
            await Delay(5000);

            try{
                await ProcessThread(this.m_arrThreads[0]);
            }catch(error){
                console.error(error);
            }

            this.m_arrThreads.shift();
        }

        this.m_arrThreads = [];
        this.m_bActive = false;

    }


}

export const threadQueue = new ThreadQueue();