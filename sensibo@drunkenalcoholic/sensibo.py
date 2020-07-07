
#!/usr/bin/env python3

import requests
import json
import sys


# Variables until I can get Budgie setting panel working
SERVER = 'https://home.sensibo.com/api/v2'
APIKEY = '' 
DEVICEID = ''
ac_state = ''

#APIKEY = 'du9lHnKCFDEVtpUpgiAsCeKQCJmAp2' #change to your own API key
#DEVICEID = 'DAqXdYTv' # change to device ID


# Sensibo API
class SensiboClientAPI(object):
    def __init__(self, api_key):
        self._api_key = api_key

    def _get(self, path, **params):
        params['apiKey'] = self._api_key
        response = requests.get(SERVER + path, params=params)
        response.raise_for_status()
        return response.json()

    def _patch(self, path, data, **params):
        params['apiKey'] = self._api_key
        response = requests.patch(SERVER + path, params=params, data=data)
        response.raise_for_status()
        return response.json()

    def devices(self):
        result = self._get("/users/me/pods", fields="id,room")
        return {x['room']['name']: x['id'] for x in result['result']}

    def pod_measurement(self, podUid):
        result = self._get("/pods/%s/measurements" % podUid)
        return result['result']

    def pod_ac_state(self, podUid):
        result = self._get("/pods/%s/acStates" %
                           podUid, limit=1, fields="status,reason,acState")
        return result['result'][0]['acState']

    def pod_change_ac_state(self, podUid, currentAcState, propertyToChange, newValue):
        self._patch("/pods/%s/acStates/%s" % (podUid, propertyToChange),
                    json.dumps({'currentAcState': currentAcState, 'newValue': newValue}))

    def getACNow(self):
        try:
            ac_now = self.pod_measurement(DEVICEID)
            return ac_now
        except ValueError:
            return False
        except Exception:
            return False

    def getACState(self):
        try:
            ac_state = self.pod_ac_state(DEVICEID)
            return ac_state
        except ValueError:
            return False
        except Exception:
            return False



total = len(sys.argv)
cmdargs = str(sys.argv)


if total >= 3 :
    # Setup Object
    APIKEY = str(sys.argv[2])
    DEVICEID = str(sys.argv[3])
    client = SensiboClientAPI(APIKEY)

    # If the --data argument was passed then...
    if str(sys.argv[1]) == '--data':
        # Current On / Off State
        ac_state = client.getACState()
        if ac_state != False:
            print(ac_state['on'])
        else:
            print('Error: On/Off State')

        # Get Temp and Humidity values    
        ac_now = client.getACNow()
        if ac_now != False:
            print('Temperature: ' + (str(ac_now[0]['temperature']) + ' °' + '\nHumidity: ' + str(ac_now[0]['humidity']) + ' %'))
        else:
            print('Error: Values')

    if str(sys.argv[1]) == '--on':
        client.pod_change_ac_state(DEVICEID, ac_state, "on", True)
        # Current On / Off State
        ac_state = client.getACState()
        if ac_state != False:
            print(ac_state['on'])

    if str(sys.argv[1]) == '--off':
        client.pod_change_ac_state(DEVICEID, ac_state, "on", False)
        # Current On / Off State
        ac_state = client.getACState()
        if ac_state != False:
            print(ac_state['on'])

else:
     print('no --data found in arguments')



