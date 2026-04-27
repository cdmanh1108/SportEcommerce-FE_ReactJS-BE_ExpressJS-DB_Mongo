# [IE213.P21.GROUPX] - ĐỒ ÁN XÂY DỰNG WEBSITE BÁN ĐỒ THỂ THAO PHẦN FRONT_END DÀNH CHO USER VÀ ADMIN

* Trường Đại học Công nghệ Thông tin, Đại học Quốc gia Thành phố Hồ Chí Minh (ĐHQG-HCM)
* Khoa: Khoa học và Kỹ thuật Thông tin (KH&KTTT)
* GVHD: ThS. Võ Tấn Khoa
* Nhóm sinh viên thực hiện: Nhóm X

## Danh sách thành viên
|STT | Họ tên | MSSV|Chức vụ|
|:---:|:-------------:|:-----:|:-----:|
|1. 	| Châu Đức Mạnh | 22520846 | Nhóm trưởng |
|2. 	| Võ Văn Phi Thông		| 22521435 | Thành viên |
|3. 	| Dương Anh Vũ		|	22521688 | Thành viên |
|4. 	| Phạm Quang Vũ | 22521696 | Thành viên |

## Giới thiệu
Trong bối cảnh nhu cầu rèn luyện sức khỏe và thể thao ngày càng được chú trọng, việc sở hữu những sản phẩm thể thao chất lượng đã trở thành một phần thiết yếu trong đời sống hiện đại. Song song với đó, xu hướng mua sắm trực tuyến đang ngày càng phát triển mạnh mẽ, tạo điều kiện thuận lợi cho người tiêu dùng tiếp cận sản phẩm một cách nhanh chóng và tiện lợi.

Nhằm đáp ứng xu hướng này, nhóm quyết định thực hiện đề tài "Xây dựng website bán đồ thể thao WTMSport" với mục tiêu tạo ra một nền tảng mua sắm tiện lợi, hiện đại và thân thiện với người dùng.

## Tính năng
|ID	|Tên tác nhân |	Mô tả tác nhân|
|:---:|:-------------:|:-----:|
|AC1	|Unauthenticated User (Người dùng chưa xác thực) |	Người dùng không có tài khoản hoặc có tài khoản nhưng chưa đăng nhập, với vai trò này người dùng được thực hiện một số chức năng như mua hàng, xem sản phẩm, xem thông tin cửa hàng, bài viết...|
|AC2	|Authenticated User (Người dùng đã xác thực) |	Người dùng có tài khoản và đã đăng nhập, với vai trò này người dùng có thể thực hiện các chức năng mua hàng, thêm giỏ hàng, thêm yêu thích, thay đổi thông tin cá nhân...|
|AC3 |Administrator (Quản trị viên) | Là người dùng có quyền hạn cao nhất trong hệ thống. Quản trị viên chịu trách nhiệm quản lý các họat động như quản lý bán hàng, quản lý khách hàng, quản lý doanh thu, quản lý đơn hàng, quản lý kho. Ngoài ra, quản trị viên cũng đảm bảo hoạt động chung của hệ thống diễn ra suôn sẻ.|

|Mã chức năng	|	Tên chức năng	|	Tác nhân	| Hoàn thành |
|:---:|:-------------:|:-----:|:-----:|
||	UC1. QLBH	(Quản lý bán hàng)					||
|	UC1.01	|	Thêm sản phẩm	|	Admin	| 100%|
|	UC1.02	| Chỉnh sửa sản phẩm	|	Admin	| 100%|
|	UC1.03	| Thêm mã giảm giá	|	Admin	| 100%|
|	UC1.04	| Chỉnh sửa mã giảm giá	|	Admin	| 100%|
|	UC1.05	|	Tìm kiếm sản phẩm 	|	Unauthenticated User, Authenticated User	| 100%|
|	UC1.06	|	Xem chi tiết sản phẩm	|	Unauthenticated User, Authenticated User 	| 100%|
|	UC1.07	|	Thêm vào giỏ hàng	|	Authenticated User 	| 100%|
|	UC1.08	|	Xem giỏ hàng	|	Authenticated User 	| 100%|
|	UC1.09	|	Thêm sản phẩm vào yêu thích	|	Authenticated User 	| 100%|
|	UC1.010	|	Xem sản phẩm yêu thích	|	Authenticated User	| 100%|
|	UC1.011	|	Mua ngay sản phẩm	|	Authenticated User, Authenticated User	| 100%|
|	UC1.12	|	Mua hàng	|	Authenticated User	| 100%|
|	UC1.13	|	Thanh toán	|	Authenticated User, Authenticated User	| 100%|
|	UC1.14	|	Đánh giá sản phẩm	|	Authenticated User	| 100%|
|	UC1.15	|	Xem đánh giá sản phẩm	|	Unauthenticated User, Authenticated User	| 100%|
||	UC2. QLKHO	 (Quản lý Kho)					||
|	UC2.01	|	Thêm danh mục sản phẩm	|	Admin	| 100%|
|	UC2.02	|	Chỉnh sửa danh mục sản phẩm	|	Admin	| 100%|
||	UC3. QLKH (Quản lý khách hàng)					||
|	UC3.01	|	Đăng ký	|	Unauthenticated User	| 100%|
|	UC3.02	|	Đăng nhập	|	Unauthenticated User	| 100%|
|	UC3.03	|	Quên mật khẩu	|	Unauthenticated User	| 100%|
|	UC3.04	|	Chỉnh sửa thông tin (Thông tin cá nhân, email. số điện thoại, địa chỉ...)	|	Authenticated User	| 100%|
|	UC3.05	|	Xem thông tin	|	Authenticated User	| 100%|
||	UC4. QLDH (Quản lý đơn hàng)||
|	UC4.01	|	Xem trạng thái đơn hàng	|	Authenticated User	| 100%|
|	UC4.02	|	Xem chi tiết đơn hàng	|	Unauthenticated User, Authenticated User	| 100%|
|	UC4.03	|	Yêu cầu hoàn hàng	| Authenticated User | 0%|
|	UC4.04	| Thay đổi trạng thái đơn hàng	|	Admin	| 100%|
|	UC4.05	| Xử lý hoàn hàng	|	Admin	| 100%|
||	UC5. QLDT (Quản lý doanh thu)||
|	UC5.01	|	Xem doanh thu	|	Admin	| 100%|
|	UC5.02	|	Xem thông tin tổng quan (Số lượng khách hàng, số lượng đơn hàng...) |	Admin	| 100%|

## Công nghệ sử dụng nổi bật
* **Front-end:** React.js, Tailwind CSS, HTML/CSS/JS.
* **Back-end:** Node.js, Express.js.
* **Cơ sở dữ liệu:** MongoDB (với Mongoose), Redis (cho Cache & quản lý OTP).
* **Dịch vụ Đám mây & Triển khai (AWS & DevOps):**
  * **Frontend:** Hosting tĩnh trên AWS S3, phân phối toàn cầu qua CloudFront (CDN), quản lý DNS bằng Route 53.
  * **Backend:** Triển khai trên máy chủ ảo AWS EC2, đóng gói bằng Docker, sử dụng Nginx làm Reverse Proxy.
  * **CI/CD:** Tự động hóa pipeline triển khai qua Jenkins và GitHub.
* **Tích hợp bên thứ ba (Third-party Services):**
  * **PayOS:** Cổng thanh toán trực tuyến nội địa, tạo mã QR tự động xác nhận giao dịch.
  * **Firebase:** Hỗ trợ đăng nhập nhanh bằng tài khoản Google (OAuth 2.0).
  * **OpenAI (ChatGPT 4.0):** Tích hợp AI Chatbot tư vấn khách hàng và hỗ trợ tìm kiếm sản phẩm thông minh bằng ngôn ngữ tự nhiên (Sử dụng RAG - Knowledge Chunk).
  * **Socket.io:** Đẩy thông báo thời gian thực (Real-time notifications) trực tiếp cho người dùng.
  * **Nodemailer:** Gửi email xác thực mã OTP tự động.

![Cloud Architecture](https://via.placeholder.com/800x400.png?text=AWS+Cloud+Architecture+Diagram)

## Lược đồ Cơ sở dữ liệu (Database Schema)

Hệ thống được thiết kế dựa trên CSDL phi quan hệ MongoDB. Dưới đây là các Model (Collection) chính:

* **User (`User.model.js`):** Quản lý thông tin người dùng, quyền (Roles), địa chỉ nhận hàng.
* **Product (`Product.model.js`):** Thông tin sản phẩm, phân cấp màu sắc (colors) và kích cỡ (variants), tồn kho (countInStock).
* **Category (`Category.model.js`):** Phân cấp danh mục sản phẩm.
* **Order (`Order.model.js`):** Lưu trữ thông tin đơn hàng, trạng thái, mã giao dịch thanh toán PayOS.
* **Cart (`Cart.model.js`):** Lưu trữ giỏ hàng cá nhân hóa theo từng User.
* **Discount (`Discount.model.js`):** Quản lý mã giảm giá (voucher), điều kiện và số lượng khả dụng.
* **Favourite (`Favourite.model.js`):** Lưu trữ danh sách yêu thích của người dùng.
* **Feedback (`Feedback.model.js`):** Review, số sao đánh giá và bình luận sản phẩm.
* **Notification (`Notification.model.js`):** Lưu trữ thông báo gửi đến người dùng (đọc/chưa đọc).
* **KnowledgeChunk (`KnowledgeChunk.model.js`):** Dữ liệu dạng khối nhúng (Vector/Chunks) hỗ trợ làm tài nguyên cho AI Chatbot đọc hiểu thông tin cửa hàng.
* **ChatConversation & ChatMessage:** Lưu trữ lịch sử đoạn chat với AI.
* **Store (`Store.model.js`):** Thông tin cấu hình chi nhánh cửa hàng.
* **LoginHistory (`LoginHistory.model.js`):** Theo dõi lịch sử và IP đăng nhập hỗ trợ bảo mật.

![Database Schema](https://via.placeholder.com/800x500.png?text=MongoDB+Database+Collections+Diagram)