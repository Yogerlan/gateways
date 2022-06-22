import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DevicesComponent } from './devices/devices.component';
import { GatewaysComponent } from './gateways/gateways.component';

const routes: Routes = [
  {
    path: 'gateways',
    component: GatewaysComponent
  }, {
    path: 'devices',
    component: DevicesComponent
  }, {
    path: '',
    redirectTo: '/gateways',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }