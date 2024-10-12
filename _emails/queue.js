
import { ProcessThread } from './inbox.js';
import { Delay } from './threads.js';

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

        for(const thread of this.m_arrThreads){

            if(!this.IsActive()){
                break;
            }
            
            await Delay(5000);

            try{
                await ProcessThread(thread);
            }catch(error){
                console.error(error);
            }
        }

        this.m_arrThreads = [];
        this.m_bActive = false;

    }


}

export const threadQueue = new ThreadQueue();