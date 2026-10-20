import {readSetting,writeSetting} from './apiClient';
// Installer bootstrap contains only a salted PBKDF2 verifier; never plaintext.
const record={"salt": [204, 40, 108, 180, 208, 84, 255, 36, 111, 213, 44, 118, 246, 209, 172, 8], "hash": [101, 89, 119, 245, 157, 10, 234, 47, 229, 173, 240, 134, 98, 47, 131, 154, 68, 238, 244, 247, 156, 104, 148, 12, 200, 77, 133, 7, 117, 171, 97, 17], "iterations": 210000};
export function applyAdminBootstrap(){if(readSetting('admin_bootstrap_v080',false))return;const previous=readSetting('admin_password_record',null);if(previous)writeSetting('admin_password_before_bootstrap',previous);writeSetting('admin_password_record',record);writeSetting('admin_password_lock',{attempts:0,until:0});writeSetting('admin_bootstrap_v080',true);}
