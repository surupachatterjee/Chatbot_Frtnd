import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import { ApiAiClient } from 'api-ai-javascript/es6/ApiAiClient';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';


export class  Message {
  constructor(public  content: {}, public sentBy: string, public contentType: string) {
  }
}

@Injectable()
export class ChatService {

  readonly  token = environment.dialogflow.angularBot;
  readonly client = new ApiAiClient({accessToken: this.token});
  conversation = new BehaviorSubject<Message[]>([]);


  constructor() { }

  update(msg: Message) {
    this.conversation.next([msg]);
  }

  converse(msg: string) {
    const userMessage = new Message(msg, 'user','Text');
    this.update(userMessage);
    let speech;
    let contentType;
    return this.client.textRequest(msg)
      .then(res => {
        // console.log(res);
        console.log(res);

        if (res.result.fulfillment.speech !== '') {
          speech = res.result.fulfillment.speech;
          contentType = 'Text';
        } else {
          speech = res.result.fulfillment.messages[0].payload.wells;
          contentType = 'wellsArray';
          console.log(speech);
        }
        // console.log(speech[0].payload);
        // const wellarray = speech[0].payload.wells;
        // console.log(wellarray);

        const botMessage = new Message(speech, 'bot', contentType);
        this.update(botMessage);
      });
  }
  talk() {
    this.client.textRequest('Who are you?')
      .then(res => console.log(res));

}


}
