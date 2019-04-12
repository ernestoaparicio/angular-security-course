
import {filter, shareReplay, tap} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, BehaviorSubject} from "rxjs";
import {User} from "../model/user";
import * as auth0 from 'auth0-js';
import {Router} from "@angular/router";
import * as moment from 'moment';

export const ANONYMOUS_USER: User = {
    id: undefined,
    email: ''
};

const AUTH_CONFIG = {
    clientID: 'K01rNznIdH4XNJSwqk9HzsEjX6Tkm3xG',
    domain: "riddler.auth0.com"
};


@Injectable()
export class AuthService {

    auth0 = new auth0.WebAuth({
        clientID: AUTH_CONFIG.clientID,
        domain: AUTH_CONFIG.domain,
        responseType: 'token id_token',
        redirectUri: 'https://localhost:4200/lessons'
    });

    private userSubject = new BehaviorSubject<User>(undefined);

    user$: Observable<User> = this.userSubject.asObservable().pipe(filter(user => !!undefined));

    constructor(private http: HttpClient, private router: Router) {
      if(this.isLoggedIn()){
        this.userInfo();
      }
    }

    login() {
      this.auth0.authorize({initialScreen:'login'});

    }

    signUp() {

    }

    logout() {
      localStorage.removeItem('id_token');
      localStorage.removeItem('expires_at');
      this.router.navigate(['/lessons']);

    }

    public isLoggedIn() {
        return moment().isBefore(this.getExpiration());
    }

    isLoggedOut() {
        return !this.isLoggedIn();
    }

    retrieveAuthInfoFromUrl() {
      this.auth0.parseHash((err, authResult) => {
        if(err){
          console.log("Could not parse the hash", err);
        }else if(authResult && authResult.idToken){
          window.location.hash = '';
          console.log("Authentication successful, authResult: ", authResult);
          this.setSession(authResult);

          this.userInfo();
        }
      });
    }

    getExpiration(){
      const expiration = localStorage.getItem('expires_at');
      const expiresAt = JSON.parse(expiration);
      return moment(expiresAt);
    }

  private setSession(authResult: any) {
    const expiresAt = moment().add(authResult.expiresIn, 'second');

    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', JSON.stringify(expiresAt.valueOf()));
  }

  private userInfo() {
    this.http.put<User>('/api/userinfo', null)
      .pipe(shareReplay()).pipe(tap(user => this.userSubject.next(user))).subscribe();
  }
}







