import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChulaSsoService } from 'src/app/core/services/chula-sso.service';
import {
  take,
  pluck,
  switchMap,
  startWith,
  withLatestFrom,
} from 'rxjs/operators';
import { ApiService } from 'src/app/api/services';
import { EMPTY, Subject, Observable } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { FooterService } from 'src/app/core/services/footer.service';
import { NavbarService } from 'src/app/core/services/navbar.service';

@Component({
  selector: 'app-ballhome',
  templateUrl: './ballhome.component.html',
  styleUrls: ['./ballhome.component.scss'],
})
export class BallHomeComponent implements OnInit, OnDestroy {
  loginError$ = new Subject<string>();
  validateSSO$: Observable<any>;
  waitingForValidation = false;
  constructor(
    private sso: ChulaSsoService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private navbarService: NavbarService,
    private footerService: FooterService
  ) {
    this.footerService.hide();
    this.navbarService.hide();
  }

  ngOnInit(): void {
    this.validateSSO$ = this.route.queryParamMap.pipe(
      take(1),
      pluck('params'),
      pluck('ticket'),
      switchMap((ticket: string) => {
        if (ticket) {
          return this.apiService
            .getChulaSsoValidateTicket(ticket)
            .pipe(startWith({}));
        } else {
          return EMPTY;
        }
      })
    );
    this.validateSSO$
      .pipe(
        withLatestFrom(
          this.route.queryParamMap.pipe(
            take(1),
            pluck('params'),
            pluck('redirectto')
          )
        )
      )
      .subscribe(
        ([{ token }, returnURL]: [{ token: string }, string]) => {
          if (token) {
            this.authService.setToken(token);
            this.router.navigate([returnURL ? returnURL : '/profile']);
          } else {
            this.waitingForValidation = true;
          }
        },
        _ => {
          this.loginError$.next('Something went wrong, Please try again');
          this.waitingForValidation = false;
          this.router.navigate(['/']);
        }
      );
  }

  login() {
    this.loginError$.next();
    this.sso.login();
  }

  ngOnDestroy() {
    this.navbarService.show();
    this.footerService.show();
  }
}
