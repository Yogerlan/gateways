import { Component, OnInit } from '@angular/core';
import { Modal, Toast } from 'bootstrap';
import { GatewaysService } from '../services/gateways.service';

@Component({
  selector: 'app-gateways',
  templateUrl: './gateways.component.html',
  styleUrls: ['./gateways.component.css']
})
export class GatewaysComponent implements OnInit {
  gateways: Array<any> = [];
  properties: Array<any> = [];
  devices: Array<any> = [];
  toast = { msg: '' };

  constructor(private gatewaysService: GatewaysService) { }

  ngOnInit(): void {
    this.listGateways();
  }

  listGateways() {
    this.gatewaysService.index().subscribe((gateways: any) => {
      console.log(gateways);
      this.gateways = gateways;
    });
  }

  showGateway(uuid: string) {
    this.gatewaysService.show(uuid).subscribe((gateway: any) => {
      console.log(gateway);
      this.devices = gateway.devices;
      this.properties = [{
        label: 'UUID',
        value: gateway.uuid
      }, {
        label: 'Name',
        value: gateway.name
      }, {
        label: 'IPv4',
        value: gateway.ipv4
      }];
      const showGatewayModal = new Modal('#showGatewayModal');
      showGatewayModal.toggle();
    });
  }

  addGateway() {
    (document.getElementById('addGatewayName') as HTMLInputElement).value = '';
    (document.getElementById('addGatewayIPv4') as HTMLInputElement).value = '';
    const addGatewayModal = new Modal('#addGatewayModal');
    addGatewayModal.toggle();
  }

  storeGateway() {
    const name = (document.getElementById('addGatewayName') as HTMLInputElement)?.value;
    const ipv4 = (document.getElementById('addGatewayIPv4') as HTMLInputElement)?.value;

    this.gatewaysService.store({ name, ipv4 }).subscribe(
      (response: any) => {
        console.log(response);
        this.toast.msg = response.msg;
        const msgToats = new Toast('#msgToast');
        msgToats.show();
        this.listGateways();
      },
      (response: any) => {
        console.log(response);
        this.toast.msg = response.error.msg;
        const msgToats = new Toast('#msgToast');
        msgToats.show();
      }
    );
  }

  editGateway(uuid: string) {
    this.gatewaysService.show(uuid).subscribe((gateway: any) => {
      console.log(gateway);
      (document.getElementById('editGatewayUUID') as HTMLInputElement).value = gateway.uuid;
      (document.getElementById('editGatewayName') as HTMLInputElement).value = gateway.name;
      (document.getElementById('editGatewayIPv4') as HTMLInputElement).value = gateway.ipv4;
      const editGatewayModal = new Modal('#editGatewayModal');
      editGatewayModal.toggle();
    });
  }

  updateGateway() {
    const uuid = (document.getElementById('editGatewayUUID') as HTMLInputElement)?.value;
    const name = (document.getElementById('editGatewayName') as HTMLInputElement)?.value;
    const ipv4 = (document.getElementById('editGatewayIPv4') as HTMLInputElement)?.value;

    this.gatewaysService.update(uuid, { name, ipv4 }).subscribe(
      (response: any) => {
        console.log(response);
        this.toast.msg = response.msg;
        const msgToats = new Toast('#msgToast');
        msgToats.show();
        this.listGateways();
      },
      (response: any) => {
        console.log(response);
        this.toast.msg = response.error.msg;
        const msgToats = new Toast('#msgToast');
        msgToats.show();
      }
    );
  }

  dropGateway(uuid: string) {
    (document.getElementById('dropGatewayUUID') as HTMLInputElement).value = uuid;
    const dropGatewayModal = new Modal('#dropGatewayModal');
    dropGatewayModal.toggle();
  }

  deleteGateway() {
    const uuid = (document.getElementById('dropGatewayUUID') as HTMLInputElement)?.value;

    this.gatewaysService.delete(uuid).subscribe(
      (response: any) => {
        console.log(response);
        this.toast.msg = response.msg;
        const msgToats = new Toast('#msgToast');
        msgToats.show();
        this.listGateways();
      },
      (response: any) => {
        console.log(response);
        this.toast.msg = response.error.msg;
        const msgToats = new Toast('#msgToast');
        msgToats.show();
      }
    );
  }
}