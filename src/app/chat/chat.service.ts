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

  readonly token = environment.dialogflow.angularBot;
  readonly client = new ApiAiClient({accessToken: this.token});
  conversation = new BehaviorSubject<Message[]>([]);
  mailApiURL = 'https://shrouded-gorge-33384.herokuapp.com/api/wells/email';


  constructor() {
  }

  update(msg: Message) {
    this.conversation.next([msg]);
  }

  converse(msg: string) {
    const userMessage = new Message(msg, 'user', 'Text');
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

        if (res.result.contexts[0] === 'await-phone' || res.result.contexts[0] === 'await-email') {
          let resource;
          let resourceType;
          if (res.result.contexts[0] === 'await-email') {
            resource = res.result.contexts[0].parameters.email;
            resourceType = 'email';
          } else if (res.result.contexts[0] === 'await-phone') {
            resource = res.result.contexts[0].parameters.phone;
            resourceType = 'phone';
          }
          if (resourceType === 'email') {
            const reqBody = {
              method: 'post',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                personalizations: [{to: [{email: 'chatterjee.surupa63@gmail.com'}]}],
                from: {email: 'no-reply@gmail.com'},
                subject: 'Well Chat Directions',
                content: [{type: 'text/plain', value: 'Here is a test msg'}]
              })
            };
            fetch(this.mailApiURL, reqBody);
          }
        }

      });
  }

  talk() {
    this.client.textRequest('Who are you?')
      .then(res => console.log(res));
  }
}

