import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ProjectService } from '../../../shared/services/project.service';
import { NgbPopover } from '../../../../../node_modules/@ng-bootstrap/ng-bootstrap';
import { FormControl } from '../../../../../node_modules/@angular/forms';
import { UserService } from '../../../shared/services/user.service';
import { DatePipe } from '../../../../../node_modules/@angular/common';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {

  public props = {

    isUpdatingNow: false,
    deleteConfirmInput: null,
  }

  public user = {
    users: [],
    selectedUsers: [],
    totalUserCount: null,
    signedUpTodayUserCount: null,
    activeUserId: null,
    isDeleteUser: false,
  }

  public member = {
    members: [],
    selectedMembers: [],
    totalMemberCount: null,
    signedUpTodayMemberCount: null,
    activeMemberId: null,
    isDeleteMember: false,

    addMember : {
      isAddMember: false,
      addMemberEmails: [],
      errorMessages: null,
      validators: null
    }
  }

  public $uns : any = [];

  constructor(private projectService: ProjectService, private userService: UserService, private cdRef: ChangeDetectorRef, private datePipe: DatePipe) {
    this.user.totalUserCount = 0;
    this.user.signedUpTodayUserCount = 0;
  
    this.member.totalMemberCount = 12;
    this.member.signedUpTodayMemberCount = 1;

    this.member.members = [
      {
        id: 0,
        memberInfo: {
          name: 'HeCToR',
          memberAvatar: '/assets/avatar.jpg',
          registeredDate: 'Mar 2, 2018'
        },
        usage: {
          usagePercent: 90,
          usagePeriod: 'Jun 11, 2015 - Jul 10, 2015'
        },
        activity: {
          activityType: 'Last login',
          activityContent: '5 minutes ago'
        },
        role: 'Admin',
        status: true,
        playOrPause: true
      },
    ];
  
    this.member.addMember.errorMessages = {
      'emailValidator' : 'Enter valid email address'
    }
    this.member.addMember.validators = [this.emailValidator];
  }

  ngOnInit() {
    this.projectService.changePageTitle({
      pageTitle: 'Admin',
      isTitleEditable: false
    });

    this.userService._inviteAdmin(22);
    this.userService._getUsers();

    this.$uns.push(this.userService.onGetUsers.subscribe((response) => {
      const success = response.success;
      if (success) {
        this.user.users = [];

        const current = new Date();

        response.users.forEach(user => {
          const registeredDate = new Date(user.usr_created_at);
          const lastLoginDate = user.usr_lastlogin_at ? new Date(user.usr_lastlogin_at) : null;

          let newUser = {
            id: user.usr_id,
            userInfo: {
              name: user.usr_name,
              userAvatar: user.usr_profile_path ? user.usr_profile_path : '/assets/avatar.jpg',
              registeredDate: this.datePipe.transform(registeredDate, 'MMM dd, yyyy')
            },
            usage: {
              usagePercent: 90,
              usagePeriod: 'Jun 11, 2015 - Jul 10, 2015'
            },
            lastLoginDate: lastLoginDate ? this.diffsBetweenDate(current, lastLoginDate) + ' ago' : '',
            company: user.usr_company,
            playOrPause: true
          }

          this.user.users.push(newUser);
        });
        this.user.totalUserCount = response.users_count;
        this.user.signedUpTodayUserCount = response.today_signedup_users_count;

        this.cdRef.markForCheck();
      }
    }));
  }

  /**
   * 
   * Functions for User Tab
   */


  onActivateUser(event) {
    this.user.activeUserId = event.row.usr_id;
  }

  onDeleteUser() {
    console.log(this.user.activeUserId);

    this.user.isDeleteUser = true;
    this.props.deleteConfirmInput = '';
  }

  onCancelDeleteUser() {
    this.user.isDeleteUser = false;
  }

  onConfirmDeleteUser() {
    this.user.isDeleteUser = false;

    if (this.props.deleteConfirmInput == 'delete') {
      this.props.isUpdatingNow = true;
      // this.userService._deleteUser();
    }
  }

  /**
   * Functions for Member Tab
   */
  onActivateMember(event) {
    this.member.activeMemberId = event.row.id;
  }

  onDeleteMember() {
    console.log(this.member.activeMemberId);

    this.member.isDeleteMember = true;
    this.props.deleteConfirmInput = '';
  }

  onCancelDeleteMember() {
    this.member.isDeleteMember = false;
  }

  onConfirmDeleteMember() {
    this.member.isDeleteMember = false;

    if (this.props.deleteConfirmInput == 'delete') {
      this.props.isUpdatingNow = true;
      // this.memberService._deletemember();
    }
  }

  onAddMember() {
    this.member.addMember.isAddMember = true;
  }

  onCancelAddMember() {
    this.member.addMember.isAddMember = false;
  }

  onConfirmAddMember() {
    this.member.addMember.isAddMember = false;

    console.log(this.member.addMember.addMemberEmails);
    this.member.addMember.addMemberEmails = [];
  }

  /**
   * 
   * Static functions
   */

  toggleOptionPopover(popover) {
    if (popover.isOpen()) {
      popover.close();
    } else {
      popover.open();
    }
  }


  numberFormat(_number, _sep) {
    if (_number == 0) {
      return 0;
    }
    _number = typeof _number != "undefined" && _number > 0 ? _number : "";
    _number = _number.replace(new RegExp("^(\\d{" + (_number.length%3? _number.length%3:0) + "})(\\d{3})", "g"), "$1 $2").replace(/(\d{3})+?/gi, "$1 ").trim();
    if(typeof _sep != "undefined" && _sep != " ") {
        _number = _number.replace(/\s/g, _sep);
    }
    return _number;
  }

  diffsBetweenDate(date1, date2) {
    var diffMs = (date1 - date2); // milliseconds between now & Christmas
    var diffDays = Math.floor(diffMs / 86400000); // days
    var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
    var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
    var diffSecs = Math.round((((diffMs % 86400000) % 3600000) % 60000) / 1000); // seconds

    var returnValue = '';
    if (diffDays != 0) {
      returnValue += diffDays;
      returnValue += (diffDays == 1) ? ' day ' : ' days ';
    }
    if (diffHrs != 0) {
      returnValue += diffHrs;
      returnValue += (diffHrs == 1) ? ' hour ' : ' hours ';
    }
    if (diffMins != 0) {
      returnValue += diffMins;
      returnValue += (diffMins == 1) ? ' minute ' : ' minutes ';
    }
    if (diffDays == 0 && diffHrs == 0 && diffMins == 0 && diffSecs != 0) {
      returnValue = diffSecs + ' seconds';
    }
    return returnValue;
  }

  nameComparator(propA, propB) {
    if (propA.userName.toLowerCase() < propB.userName.toLowerCase()) return -1;
    if (propA.userName.toLowerCase() > propB.userName.toLowerCase()) return 1;
    return 0;
  }

  usageComparator(propA, propB) {
    if (propA.usagePercent < propB.usagePercent) return -1;
    if (propA.usagePercent > propB.usagePercent) return 1;
    return 0;
  }

  emailValidator(control: FormControl) {
    var EMAIL_REGEXP = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
    if (control.value != "" && (control.value.length <= 5 || !EMAIL_REGEXP.test(control.value))) {
      return { "emailValidator": true };
    }
    return null
  }
}
