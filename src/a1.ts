/* eslint-disable
    camelcase,
    constructor-super,
    no-constant-condition,
    no-eval,
    no-this-before-super,
    no-unused-vars,
    standard/no-callback-literal,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS201: Simplify complex destructure assignments
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Parser } from 'xml2js';
import moment from 'moment-timezone';
import { ShipperClient, STATUS_TYPES } from './shipper';

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}

class A1Client extends ShipperClient {
  private STATUS_MAP = new Map<string, STATUS_TYPES>([
    ['101', STATUS_TYPES.EN_ROUTE],
    ['102', STATUS_TYPES.EN_ROUTE],
    ['302', STATUS_TYPES.OUT_FOR_DELIVERY],
    ['304', STATUS_TYPES.DELAYED],
    ['301', STATUS_TYPES.DELIVERED]
  ]);

  parser: Parser;

  constructor(options) {
    super();
    this.options = options;
    this.parser = new Parser();
  }

  validateResponse(response, cb) {
    function handleResponse(xmlErr, trackResult) {
      if ((xmlErr != null) || (trackResult == null)) { return cb(xmlErr); }
      const trackingInfo = __guard__(trackResult.AmazonTrackingResponse != null ? trackResult.AmazonTrackingResponse.PackageTrackingInfo : undefined, x => x[0]);
      if ((trackingInfo != null ? trackingInfo.TrackingNumber : undefined) == null) {
        const errorInfo = __guard__(trackResult.AmazonTrackingResponse != null ? trackResult.AmazonTrackingResponse.TrackingErrorInfo : undefined, x1 => x1[0]);
        const error = __guard__(__guard__(__guard__(errorInfo != null ? errorInfo.TrackingErrorDetail : undefined, x4 => x4[0]), x3 => x3.ErrorDetailCodeDesc), x2 => x2[0]);
        if (error != null) { return cb(error); }
        cb('unknown error');
      }
      return cb(null, trackingInfo);
    }

    this.parser.reset();
    return this.parser.parseString(response, handleResponse);
  }

  presentAddress(address) {
    if (address == null) { return; }
    const city = address.City != null ? address.City[0] : undefined;
    const stateCode = address.StateProvince != null ? address.StateProvince[0] : undefined;
    const countryCode = address.CountryCode != null ? address.CountryCode[0] : undefined;
    const postalCode = address.PostalCode != null ? address.PostalCode[0] : undefined;
    return this.presentLocation({ city, stateCode, countryCode, postalCode });
  }

  getStatus(shipment) {
    const lastActivity = __guard__(__guard__(shipment.TrackingEventHistory != null ? shipment.TrackingEventHistory[0] : undefined, x1 => x1.TrackingEventDetail), x => x[0]);
    const statusCode = __guard__(lastActivity != null ? lastActivity.EventCode : undefined, x2 => x2[0]);
    if (statusCode == null) { return; }
    const code = parseInt(__guard__(statusCode.match(/EVENT_(.*)$/), x3 => x3[1]));
    if (isNaN(code)) { return; }
    if (this.STATUS_MAP.has(code.toString())) {
      return this.STATUS_MAP.get(code.toString());
    } else {
      if (code < 300) {
        return STATUS_TYPES.EN_ROUTE;
      } else {
        return STATUS_TYPES.UNKNOWN;
      }
    }
  }

  getActivitiesAndStatus(shipment) {
    const activities = [];
    const status = null;
    let rawActivities: any[] = __guard__(shipment.TrackingEventHistory != null ? shipment.TrackingEventHistory[0] : undefined, x => x.TrackingEventDetail);
    rawActivities = Array.from(rawActivities || []);
    for (const rawActivity of rawActivities) {
      let datetime, timestamp;
      const location = this.presentAddress(__guard__(rawActivity != null ? rawActivity.EventLocation : undefined, x1 => x1[0]));
      const rawTimestamp = rawActivity != null ? rawActivity.EventDateTime[0] : undefined;
      if (rawTimestamp != null) {
        const eventTime = moment(rawTimestamp);
        timestamp = eventTime.toDate();
        datetime = rawTimestamp.slice(0, 19);
      }
      const details = __guard__(rawActivity != null ? rawActivity.EventCodeDesc : undefined, x2 => x2[0]);

      if ((details != null) && (timestamp != null)) {
        const activity = { timestamp, datetime, location, details };
        activities.push(activity);
      }
    }
    return { activities, status: this.getStatus(shipment) };
  }

  getEta(shipment) {
    const activities = __guard__(shipment.TrackingEventHistory != null ? shipment.TrackingEventHistory[0] : undefined, x => x.TrackingEventDetail) || [];
    const firstActivity = activities[activities.length - 1];
    if (__guard__(firstActivity != null ? firstActivity.EstimatedDeliveryDate : undefined, x1 => x1[0]) == null) { return; }
    return moment(`${__guard__(firstActivity != null ? firstActivity.EstimatedDeliveryDate : undefined, x2 => x2[0])}T00:00:00Z`).toDate();
  }

  getService(shipment) {
    return null;
  }

  getWeight(shipment) {
    return null;
  }

  getDestination(shipment) {
    return this.presentAddress(__guard__(shipment != null ? shipment.PackageDestinationLocation : undefined, x => x[0]));
  }

  requestOptions({ trackingNumber }) {
    return {
      method: 'GET',
      uri: `http://www.aoneonline.com/pages/customers/trackingrequest.php?tracking_number=${trackingNumber}`
    };
  }
}

export { A1Client };