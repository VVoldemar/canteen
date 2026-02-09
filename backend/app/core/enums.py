from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    STUDENT = "student"
    COOK = "cook"
    

class Measures(str, Enum):
    WEIGHT = "Kg"
    VOLUME = "L"
    

class OrderStatus(str, Enum):
    PAID = "paid"       
    READY = "prepared"
    SERVED = "served"
    CANCELLED = "cancelled"
    

class Reports(str, Enum):
    PAYMENT = "payments" 
    ATTEND = "attendance"
    DISH = "nutrirtion"
    ALL = "full"