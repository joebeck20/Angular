import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Dish } from '../shared/dish'
import { Comment } from '../shared/comment';
import { DishService } from '../services/dish.service';
import { switchMap, timestamp } from "rxjs/operators";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { visibility, expand } from '../animations/app.animation';


@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  animations: [
   visibility(),
   expand()
  ]
  

})
export class DishdetailComponent implements OnInit {

  dish : Dish;
  dishIds : String[];
  prev : String;
  next : String;
  comment: Comment;
  errMess : String;
  dishcopy: Dish;
  visibility = 'shown';
  feedbackForm: FormGroup;
  @ViewChild('fform') feedbackFormDirective: any;

  formErrors = {
    'author': '',
    'rating': '',
    'comment': ''
  };

  validationMessages = {
    'author': {
      'required':      'Author Name is required.',
      'minlength':     'Author Name must be at least 2 characters long.',
      'maxlength':     'Author Name cannot be more than 25 characters long.'
    },
    'rating': {
      'required':      'Rating is required.'
    },
    'comment': {
      'required':      'Comment number is required.',
      'minlength':     'Comment must be at least 2 characters long.'
    }
  };

  constructor(private dishService: DishService,
    private location: Location,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    @Inject('BaseURL') private BaseURL) { 
      
    }

  ngOnInit(): void {

    this.createForm();
    this.dishService.getDishIds()
    .subscribe(dishIds => this.dishIds = dishIds);
    this.route.params.pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishService.getDish(+params['id']); }))
    .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; },
      errmess => this.errMess = <any>errmess);
    
    }

  setPrevNext(dishId : String){
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];  

  }

  goBack(): void {

    this.location.back();
  }

  createForm() {
    this.feedbackForm = this.fb.group({
      author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)] ],
      rating: [5, Validators.required ],
      comment: ['', [Validators.required, Validators.minLength(2)] ]
    });

    this.feedbackForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); //reset the form
  }

  onValueChanged(data?: any) {
    if (!this.feedbackForm) { return; }
    const form = this.feedbackForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }

  }
  
  onSubmit() {
    this.comment = this.feedbackForm.value;
    this.comment.date = new Date().toISOString();
    console.log(this.comment);
    
    this.dishcopy.comments.push(this.comment);
    this.dishService.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish; this.dishcopy = dish;
      },
      errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });
    this.feedbackFormDirective.resetForm();
    this.feedbackForm.reset({
      author: '',
      rating: 5,
      comment: ''
    });
    
 
  }

}