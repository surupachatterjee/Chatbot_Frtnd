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
  mailApiURL = 'https://shrouded-gorge-33384.herokuapp.com/api/wells/';


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

        if (res.result.contexts[0].name === 'await-phone' || res.result.contexts[0].name === 'await-email') {
          let resource;
          let resourceType;
          if (res.result.contexts[0].name === 'await-email') {
            resource = res.result.contexts[0].parameters.email;
            resourceType = 'email';
          } else if (res.result.contexts[0].name === 'await-phone') {
            resource = res.result.contexts[0].parameters['phone-number'];
            resourceType = 'phone';
          }
          if (resourceType === 'email') {
            let reqMessageWells;
            for (message in this.conversation.getValue()){
              if (message.contentType === 'wellsArray') {
                reqMessageWells = message.content;
              }
            }
            let reqMessage ;
            if (reqMessageWells !== '') {
              reqMessage = '<ul>';
              for (well in reqMessageWells) {
                reqMessage = '<li ><a href="https://www.google.com/maps/dir/?api=1&destination='
                  + well.SurfaceLatitude + ',' + well.SurfaceLongitude + '">Well# ' + well.WellNum
                  + ', ' + well.LeaseName + ', ' + well.CurrentOperatorName + ', ' + well.CurrentOperatorCity
                  + ', ' + well.County + ', ' + well.State + ', ' + well.Country + '</a></li>';
              }
              reqMessage = '</ul>';
            } else {
              reqMessage = 'No Wells information extracted';
            }
            const reqBody = {
              method: 'post',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                personalizations: [{to: [{email: resource}]}],
                from: {email: 'no-reply@gmail.com'},
                subject: 'Well Chat Directions',
                content: [{type: 'text/plain', value: reqMessage}]
              })
            };
            console.log(reqBody);
            fetch(this.mailApiURL + 'email', reqBody).then(resp => console.log(resp) );
          }

          if (resourceType === 'phone') {
            fetch(this.mailApiURL + 'sms', {
              method: 'post',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: 'This is test message from well chatbot',
                to: resource
              })
            }).then(resp => console.log(resp));
          }
        }
      });
  }

  talk() {
    this.client.textRequest('Who are you?')
      .then(res => console.log(res));
  }
}

