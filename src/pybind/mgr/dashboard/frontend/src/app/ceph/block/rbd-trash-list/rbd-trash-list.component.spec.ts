import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ToastModule } from 'ng2-toastr';
import { of } from 'rxjs';

import { By } from '@angular/platform-browser';
import { configureTestBed } from '../../../../testing/unit-test-helper';
import { RbdService } from '../../../shared/api/rbd.service';
import { CdTableSelection } from '../../../shared/models/cd-table-selection';
import { ExecutingTask } from '../../../shared/models/executing-task';
import { SummaryService } from '../../../shared/services/summary.service';
import { TaskListService } from '../../../shared/services/task-list.service';
import { SharedModule } from '../../../shared/shared.module';
import { RbdTrashListComponent } from './rbd-trash-list.component';

describe('RbdTrashListComponent', () => {
  let component: RbdTrashListComponent;
  let fixture: ComponentFixture<RbdTrashListComponent>;
  let summaryService: SummaryService;
  let rbdService: RbdService;

  configureTestBed({
    declarations: [RbdTrashListComponent],
    imports: [SharedModule, HttpClientTestingModule, RouterTestingModule, ToastModule.forRoot()],
    providers: [TaskListService, RbdService]
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RbdTrashListComponent);
    component = fixture.componentInstance;
    summaryService = TestBed.get(SummaryService);
    rbdService = TestBed.get(RbdService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load trash images when summary is trigged', () => {
    spyOn(rbdService, 'listTrash').and.callThrough();

    summaryService['summaryDataSource'].next({ executingTasks: null });
    expect(rbdService.listTrash).toHaveBeenCalled();
  });

  it('should call updateSelection', () => {
    const selection = new CdTableSelection();
    selection.selected = ['foo'];
    selection.update();

    expect(component.selection.hasSelection).toBeFalsy();
    component.updateSelection(selection);
    expect(component.selection.hasSelection).toBeTruthy();
  });

  describe('handling of executing tasks', () => {
    let images: any[];

    const addImage = (id) => {
      images.push({
        id: id
      });
    };

    const addTask = (name: string, image_id: string) => {
      const task = new ExecutingTask();
      task.name = name;
      task.metadata = {
        image_id: image_id
      };
      summaryService.addRunningTask(task);
    };

    const expectImageTasks = (image: any, executing: string) => {
      expect(image.cdExecuting).toEqual(executing);
    };

    beforeEach(() => {
      images = [];
      addImage('1');
      addImage('2');
      component.images = images;
      summaryService['summaryDataSource'].next({ executingTasks: [] });
      spyOn(rbdService, 'listTrash').and.callFake(() =>
        of([{ poool_name: 'rbd', status: 1, value: images }])
      );
      fixture.detectChanges();
    });

    it('should gets all images without tasks', () => {
      expect(component.images.length).toBe(2);
      expect(component.images.every((image) => !image.cdExecuting)).toBeTruthy();
    });

    it('should show when an existing image is being modified', () => {
      addTask('rbd/trash/remove', '1');
      addTask('rbd/trash/restore', '2');
      expect(component.images.length).toBe(2);
      expectImageTasks(component.images[0], 'Deleting');
      expectImageTasks(component.images[1], 'Restoring');
    });
  });

  describe('display purge button', () => {
    beforeEach(() => {});

    it('should show button with delete permission', () => {
      component.permission = {
        read: true,
        create: true,
        delete: true,
        update: true
      };
      fixture.detectChanges();

      const purge = fixture.debugElement.query(By.css('.table-actions button .fa-times'));
      expect(purge).not.toBeNull();
    });

    it('should remove button without delete permission', () => {
      component.permission = {
        read: true,
        create: true,
        delete: false,
        update: true
      };
      fixture.detectChanges();

      const purge = fixture.debugElement.query(By.css('.table-actions button .fa-times'));
      expect(purge).toBeNull();
    });
  });
});
