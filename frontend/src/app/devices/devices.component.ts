import { Component, OnInit } from '@angular/core';
import { Modal, Toast } from 'bootstrap';
import * as moment from 'moment';
import { DevicesService } from '../services/devices.service';
import { GatewaysService } from '../services/gateways.service';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.css']
})
export class DevicesComponent implements OnInit {
  gateways: Array<any> = [];
  properties: Array<any> = [];
  gateway_properties: Array<any> = [];
  devices: Array<any> = [];
  toast = { msg: '' };

  constructor(
    private devicesService: DevicesService,
    private gatewaysService: GatewaysService
  ) { }

  ngOnInit(): void {
    this.listDevices();
  }

  listDevices() {
    this.devicesService.index().subscribe((devices: any) => {
      console.log(devices);
      for (const device of devices) {
        device.created = moment.utc(device.created).fromNow();
      }
      this.devices = devices;
    });
  }

  showDevice(uid: number) {
    this.devicesService.show(uid).subscribe((device: any) => {
      console.log(device);
      this.properties = [{
        label: 'Vendor',
        value: device.vendor
      }, {
        label: 'Created',
        value: moment.utc(device.created).fromNow()
      }, {
        label: 'Status',
        value: device.status
      }];

      this.gatewaysService.show(device.gateway_uuid).subscribe((gateway: any) => {
        console.log(gateway);
        this.gateway_properties = [{
          label: 'UUID',
          value: gateway.uuid
        }, {
          label: 'Name',
          value: gateway.name
        }, {
          label: 'IPv4',
          value: gateway.ipv4
        }];
        const showDeviceModal = new Modal('#showDeviceModal');
        showDeviceModal.toggle();
      });
    });
  }

  addDevice() {
    (document.getElementById('addDeviceVendor') as HTMLInputElement).value = '';
    (document.getElementById('addDeviceStatus') as HTMLSelectElement).selectedIndex = 0;
    this.gatewaysService.index().subscribe((gateways: any) => {
      console.log(gateways);
      this.gateways = gateways;
      (document.getElementById('addDeviceGatewayUUID') as HTMLSelectElement).selectedIndex = 0;
      const addDeviceModal = new Modal('#addDeviceModal');
      addDeviceModal.toggle();
    });
  }

  storeDevice() {
    const vendor = (document.getElementById('addDeviceVendor') as HTMLInputElement)?.value;
    const status = (document.getElementById('addDeviceStatus') as HTMLSelectElement)?.value;
    const gateway_uuid = (document.getElementById('addDeviceGatewayUUID') as HTMLSelectElement)?.value;

    this.devicesService.store({vendor, status, gateway_uuid}).subscribe(
      (response: any) => {
        console.log(response);
        this.toast.msg = response.msg;
        const msgToats = new Toast('#msgToast');
        msgToats.show();
        this.listDevices();
      },
      (response: any) => {
        console.log(response);
        this.toast.msg = response.error.msg;
        const msgToats = new Toast('#msgToast');
        msgToats.show();
      }
    );
  }

  findIndexByText(element: HTMLSelectElement, text: string) {
    for (let i = 0; i < element.length; i++) {
      if (element[i].getAttribute('value') === text) {
        return i;
      }
    }

    return -1;
  }

  editDevice(uid: number) {
    this.devicesService.show(uid).subscribe((device: any) => {
      console.log(device);
      (document.getElementById('editDeviceUID') as HTMLInputElement).value = uid.toString();
      (document.getElementById('editDeviceVendor') as HTMLInputElement).value = device.vendor;
      const statusElement = (document.getElementById('editDeviceStatus') as HTMLSelectElement);
      statusElement.selectedIndex = this.findIndexByText(statusElement, device.status);
      this.gatewaysService.index().subscribe((gateways: any) => {
        console.log(gateways);
        this.gateways = gateways;
        // small delay until gateways select refresh 
        setTimeout(() => {
          const gatewayElement = (document.getElementById('editDeviceGatewayUUID') as HTMLSelectElement);
          gatewayElement.selectedIndex = this.findIndexByText(gatewayElement, device.gateway_uuid);
          const editDeviceModal = new Modal('#editDeviceModal');
          editDeviceModal.toggle();
        }, 500);
      });
    });
  }

  updateDevice() {
    const uid = (document.getElementById('editDeviceUID') as HTMLInputElement)?.value;
    const vendor = (document.getElementById('editDeviceVendor') as HTMLInputElement)?.value;
    const status = (document.getElementById('editDeviceStatus') as HTMLSelectElement)?.value;
    const gateway_uuid = (document.getElementById('editDeviceGatewayUUID') as HTMLSelectElement)?.value;

    this.devicesService.update(Number.parseInt(uid), { vendor, status, gateway_uuid }).subscribe(
      (response: any) => {
        console.log(response);
        this.toast.msg = response.msg;
        const msgToats = new Toast('#msgToast');
        msgToats.show();
        this.listDevices();
      },
      (response: any) => {
        console.log(response);
        this.toast.msg = response.error.msg;
        const msgToats = new Toast('#msgToast');
        msgToats.show();
      }
    );
  }

  dropDevice(uid: number) {
    (document.getElementById('dropDeviceUID') as HTMLInputElement).value = uid.toString();
    const dropDeviceModal = new Modal('#dropDeviceModal');
    dropDeviceModal.toggle();
  }

  deleteDevice() {
    const uid = (document.getElementById('dropDeviceUID') as HTMLInputElement)?.value;

    this.devicesService.delete(Number.parseInt(uid)).subscribe(
      (response: any) => {
        console.log(response);
        this.toast.msg = response.msg;
        const msgToats = new Toast('#msgToast');
        msgToats.show();
        this.listDevices();
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
